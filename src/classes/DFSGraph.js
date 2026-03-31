/**
 * DFSGraph — 그래프 데이터 + DFS 알고리즘
 * 책임: 그래프 상태 관리, DFS 스텝 시퀀스 계산
 */
export class DFSGraph {
	constructor() {
		this.nodes = []; // { id, label, x, y, state }
		this.edges = []; // { from, to }
		this.steps = []; // DFSStep[]
		this.currentIndex = -1;
	}

	/**
	 * 그래프 초기화
	 * @param {Array} nodes
	 * @param {Array} edges
	 * @param {string} startId
	 */
	initialize(nodes, edges, startId) {
		this.nodes = nodes.map((n) => ({ ...n, state: "unvisited" }));
		this.edges = edges;
		this.steps = [];
		this.currentIndex = -1;
		this._computeSteps(startId);
	}

	/** 인접 노드 목록 반환 */
	_neighbors(nodeId) {
		return this.edges.filter((e) => e.from === nodeId).map((e) => e.to);
	}

	/** DFS 스텝 전체 계산 (비재귀 스택 방식) */
	_computeSteps(startId) {
		const visited = new Set();
		const stack = [startId];
		const steps = [];

		// 초기 상태
		steps.push({
			type: "init",
			nodeId: startId,
			stack: [...stack],
			visited: [],
			edgeId: null,
			description: `시작 노드 ${startId}를 스택에 추가합니다.`,
		});

		while (stack.length > 0) {
			const current = stack.pop();

			if (visited.has(current)) {
				steps.push({
					type: "skip",
					nodeId: current,
					stack: [...stack],
					visited: [...visited],
					edgeId: null,
					description: `${current}는 이미 방문했습니다. 건너뜁니다.`,
				});
				continue;
			}

			visited.add(current);
			steps.push({
				type: "visit",
				nodeId: current,
				stack: [...stack],
				visited: [...visited],
				edgeId: null,
				description: `${current} 노드를 방문합니다.`,
			});

			const neighbors = this._neighbors(current).reverse();
			for (const neighbor of neighbors) {
				if (!visited.has(neighbor)) {
					stack.push(neighbor);
					steps.push({
						type: "push",
						nodeId: neighbor,
						stack: [...stack],
						visited: [...visited],
						edgeId: `${current}-${neighbor}`,
						description: `${current} → ${neighbor} 간선 탐색. ${neighbor}를 스택에 추가합니다.`,
					});
				}
			}
		}

		steps.push({
			type: "done",
			nodeId: null,
			stack: [],
			visited: [...visited],
			edgeId: null,
			description: `탐색 완료! 방문 순서: ${[...visited].join(" → ")}`,
		});

		this.steps = steps;
	}

	/** 현재 스텝 반환 */
	getCurrentStep() {
		return this.steps[this.currentIndex] || null;
	}

	/** 다음 스텝으로 이동. 마지막이면 null */
	nextStep() {
		if (this.currentIndex < this.steps.length - 1) {
			this.currentIndex++;
			return this.steps[this.currentIndex];
		}
		return null;
	}

	/** 이전 스텝으로 이동 */
	prevStep() {
		if (this.currentIndex > 0) {
			this.currentIndex--;
			return this.steps[this.currentIndex];
		}
		return null;
	}

	/** 첫 스텝으로 이동 */
	goToFirst() {
		this.currentIndex = 0;
		return this.steps[0] || null;
	}

	/** 마지막 스텝으로 이동 */
	goToLast() {
		this.currentIndex = this.steps.length - 1;
		return this.steps[this.currentIndex] || null;
	}

	/** 특정 인덱스로 점프 */
	goTo(index) {
		if (index >= 0 && index < this.steps.length) {
			this.currentIndex = index;
			return this.steps[index];
		}
		return null;
	}

	/** 완료 여부 */
	isDone() {
		return this.currentIndex >= this.steps.length - 1;
	}

	/** 진행률 (0~1) */
	getProgress() {
		if (this.steps.length === 0) return 0;
		return this.currentIndex / (this.steps.length - 1);
	}

	/** 노드 상태 반환 */
	getNodeState(nodeId) {
		const node = this.nodes.find((n) => n.id === nodeId);
		return node ? node.state : "unvisited";
	}

	/** 전체 스텝 수 */
	getTotalSteps() {
		return this.steps.length;
	}

	reset() {
		this.currentIndex = -1;
		this.nodes.forEach((n) => {
			n.state = "unvisited";
		});
	}
}
