/**
 * DFSVisualizer — SVG 기반 그래프 렌더러
 * 출처: step023 chunk4 (SVG 우선, 6-10노드 교육용)
 */
export class DFSVisualizer {
	constructor(svgId) {
		this.svg = document.getElementById(svgId);
		this.edgesLayer = document.getElementById("edges-layer");
		this.nodesLayer = document.getElementById("nodes-layer");

		if (!this.svg || !this.edgesLayer || !this.nodesLayer) {
			console.error(
				"[Error] DFSVisualizer: Required DOM elements not found",
				{ svg: !!this.svg, edgesLayer: !!this.edgesLayer, nodesLayer: !!this.nodesLayer }
			);
		}

		this.nodeRadius = 26;
		this._nodeEls = {}; // id → SVGElement
		this._edgeEls = {}; // "from-to" → SVGElement
		this._activeEdgeId = null; // 현재 활성 엣지 추적
		this._codeLineEls = null; // code-line 요소 캐시
		this._activeLineIdx = -1; // 현재 활성 코드라인 인덱스
	}

	/**
	 * 그래프 초기 렌더링 (scenario 로드 시 1회 호출)
	 * @param {Array} nodes
	 * @param {Array} edges
	 */
	initGraph(nodes, edges) {
		// 필수 요소 확인
		if (!this.svg || !this.edgesLayer || !this.nodesLayer) {
			console.error("[Error] DFSVisualizer.initGraph: DOM elements not initialized");
			return;
		}

		// 기존 요소 제거
		while (this.edgesLayer.firstChild)
			this.edgesLayer.removeChild(this.edgesLayer.firstChild);
		while (this.nodesLayer.firstChild)
			this.nodesLayer.removeChild(this.nodesLayer.firstChild);
		this._nodeEls = {};
		this._edgeEls = {};
		this._activeEdgeId = null;
		this._codeLineEls = null;
		this._activeLineIdx = -1;

		// SVG 크기 조정
		const bbox = this._getBoundingBox(nodes);
		this.svg.setAttribute(
			"viewBox",
			`${bbox.minX - 60} ${bbox.minY - 60} ${bbox.width + 120} ${bbox.height + 120}`,
		);

		// 엣지 렌더링
		for (const e of edges) this._renderEdge(e, nodes);

		// 노드 렌더링
		for (const n of nodes) this._renderNode(n);
	}

	_getBoundingBox(nodes) {
		const xs = nodes.map((n) => n.x);
		const ys = nodes.map((n) => n.y);
		const minX = Math.min(...xs);
		const minY = Math.min(...ys);
		const maxX = Math.max(...xs);
		const maxY = Math.max(...ys);
		return { minX, minY, width: maxX - minX, height: maxY - minY };
	}

	_renderEdge(edge, nodes) {
		const from = nodes.find((n) => n.id === edge.from);
		const to = nodes.find((n) => n.id === edge.to);
		if (!from || !to) return;

		// 노드 경계에서 시작/끝나도록 방향벡터로 오프셋 계산
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const dist = Math.sqrt(dx * dx + dy * dy) || 1;
		const r = this.nodeRadius;
		const x1 = from.x + (dx / dist) * r;
		const y1 = from.y + (dy / dist) * r;
		const x2 = to.x - (dx / dist) * (r + 6); // +6: 화살촉 길이 여백

		const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
		const y2 = to.y - (dy / dist) * (r + 6);
		line.setAttribute("x1", String(x1));
		line.setAttribute("y1", String(y1));
		line.setAttribute("x2", String(x2));
		line.setAttribute("y2", String(y2));
		line.setAttribute("class", "graph-edge");
		line.setAttribute("marker-end", "url(#arrowhead)");
		line.setAttribute("data-edge", `${edge.from}-${edge.to}`);
		this.edgesLayer.appendChild(line);
		this._edgeEls[`${edge.from}-${edge.to}`] = line;
	}

	_renderNode(node) {
		const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
		g.setAttribute("class", "graph-node-group");
		g.setAttribute("data-node", node.id);
		g.setAttribute("role", "button");
		g.setAttribute("tabindex", "0");
		g.setAttribute("aria-label", `노드 ${node.label}, 미방문`);

		const circle = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"circle",
		);
		circle.setAttribute("cx", node.x);
		circle.setAttribute("cy", node.y);
		circle.setAttribute("r", String(this.nodeRadius));
		circle.setAttribute("class", "graph-node node-unvisited");

		const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
		text.setAttribute("x", node.x);
		text.setAttribute("y", node.y + 5);
		text.setAttribute("class", "graph-node-label");
		text.setAttribute("text-anchor", "middle");
		text.textContent = node.label;

		g.appendChild(circle);
		g.appendChild(text);
		this.nodesLayer.appendChild(g);
		this._nodeEls[node.id] = g;
	}

	/**
	 * 스텝 렌더링: 노드/엣지 상태 업데이트
	 * @param {Object} step - DFSStep
	 * @param {Array} nodes
	 */
	renderStep(step, nodes) {
		if (!step) return;

		// 전체 노드 상태 초기화 후 재적용
		nodes.forEach((node) => {
			const g = this._nodeEls[node.id];
			if (!g) return;
			const circle = g.querySelector("circle");
			let state = "unvisited";
			if (step.visited?.includes(node.id)) {
				state = "visited";
			}
			if (step.nodeId === node.id && step.type === "visit") {
				state = "visiting";
			}
			circle.setAttribute("class", `graph-node node-${state}`);
			g.setAttribute(
				"aria-label",
				`노드 ${node.id}, ${this._stateLabel(state)}`,
			);
			// pulse 클래스: 현재 방문 중
			if (state === "visiting") {
				circle.classList.add("node-pulse");
			} else {
				circle.classList.remove("node-pulse");
			}
		});

		// 활성 엣지 하이라이팅 (이전 엣지만 제거 → N개 순회 대신 최대 2개 조작)
		if (this._activeEdgeId && this._edgeEls[this._activeEdgeId]) {
			this._edgeEls[this._activeEdgeId].classList.remove("edge-active");
		}
		this._activeEdgeId = step.edgeId || null;
		if (this._activeEdgeId && this._edgeEls[this._activeEdgeId]) {
			this._edgeEls[this._activeEdgeId].classList.add("edge-active");
		}
	}

	_stateLabel(state) {
		return (
			{ unvisited: "미방문", visiting: "방문 중", visited: "방문 완료" }[
				state
			] || "미방문"
		);
	}

	/**
	 * 스택 패널 업데이트
	 * @param {Array} stack
	 */
	updateStack(stack) {
		const display = document.getElementById("stack-display");
		if (!display) return;
		display.innerHTML = "";
		// 스택 top이 위에 오도록 역순 표시
		[...stack].reverse().forEach((id, i) => {
			const item = document.createElement("div");
			item.className = `stack-item${i === 0 ? " stack-top" : ""}`;
			item.textContent = id;
			item.setAttribute("role", "listitem");
			display.appendChild(item);
		});
	}

	/**
	 * 코드 하이라이팅 업데이트
	 * @param {string} stepType - init|visit|push|skip|done
	 */
	updateCodeHighlight(stepType) {
		const codeMap = {
			init: 0,
			visit: 2,
			push: 4,
			skip: 6,
			done: 8,
		};
		// 첫 호출 시 1회만 querySelectorAll, 이후 캐시 사용
		if (!this._codeLineEls) {
			this._codeLineEls = Array.from(document.querySelectorAll(".code-line"));
		}
		const nextIdx = codeMap[stepType] ?? -1;
		if (this._activeLineIdx >= 0 && this._codeLineEls[this._activeLineIdx]) {
			this._codeLineEls[this._activeLineIdx].classList.remove("active-line");
		}
		if (nextIdx >= 0 && this._codeLineEls[nextIdx]) {
			this._codeLineEls[nextIdx].classList.add("active-line");
		}
		this._activeLineIdx = nextIdx;
	}
}
