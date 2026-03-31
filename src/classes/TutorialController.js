/**
 * TutorialController — 학습 흐름 제어
 * 상태 머신: IDLE → PLAYING → PAUSED → DONE
 */
export class TutorialController {
	constructor({ graph, visualizer, engine, scenarios }) {
		this.graph = graph;
		this.visualizer = visualizer;
		this.engine = engine;
		this.scenarios = scenarios;
		this.state = "IDLE"; // IDLE | PLAYING | PAUSED | DONE
		this._currentScenario = null;
		this._stepIndex = 0;
	}

	/** 시나리오 로드 */
	loadScenario(id, { suppressAutoPlay = false } = {}) {
		const scenario = this.scenarios.find((s) => s.id === id);
		if (!scenario) return;
		this._currentScenario = scenario;
		this.engine.stop();
		this.state = "IDLE";
		this._updatePlayButton(false);

		this.graph.initialize(scenario.nodes, scenario.edges, scenario.startId);
		this.visualizer.initGraph(scenario.nodes, scenario.edges);

		// 첫 스텝(init) 렌더링
		const firstStep = this.graph.goToFirst();
		if (firstStep) this._applyStep(firstStep);

		this._updateUI();

		if (scenario.autoPlay && !suppressAutoPlay) {
			this.engine.setSpeed(scenario.speed || 0.7);
			this.play();
		}
	}

	play() {
		if (this.state === "DONE") return;
		this.state = "PLAYING";
		this._updatePlayButton(true);
		this.engine.start(() => {
			const step = this.graph.nextStep();
			if (!step) {
				this.state = "DONE";
				this._updatePlayButton(false);
				return false;
			}
			this._applyStep(step);
			this._updateUI();
			return !this.graph.isDone();
		});
	}

	pause() {
		if (this.state !== "PLAYING") return;
		this.state = "PAUSED";
		this.engine.stop();
		this._updatePlayButton(false);
	}

	togglePlay() {
		if (this.state === "PLAYING") this.pause();
		else this.play();
	}

	stepForward() {
		this.pause();
		const step = this.graph.nextStep();
		if (step) {
			this._applyStep(step);
			this._updateUI();
			if (this.graph.isDone()) this.state = "DONE";
		}
	}

	stepBackward() {
		this.pause();
		const step = this.graph.prevStep();
		if (step) {
			this._applyStep(step);
			this._updateUI();
			this.state = "PAUSED";
		}
	}

	goToFirst() {
		this.pause();
		const step = this.graph.goToFirst();
		if (step) {
			this._applyStep(step);
			this._updateUI();
		}
		this.state = "IDLE";
	}

	goToLast() {
		this.pause();
		const step = this.graph.goToLast();
		if (step) {
			this._applyStep(step);
			this._updateUI();
		}
		this.state = "DONE";
	}

	reset() {
		this.engine.reset();
		this.state = "IDLE";
		if (this._currentScenario) {
			this.loadScenario(this._currentScenario.id);
		}
	}

	/** 스텝 적용: 시각화 + UI 업데이트 */
	_applyStep(step) {
		if (!step) {
			console.warn("[Warning] TutorialController._applyStep: step is null");
			return;
		}
		const nodes = this._currentScenario?.nodes || [];
		this.visualizer.renderStep(step, nodes);
		this.visualizer.updateStack(step.stack || []);
		this.visualizer.updateCodeHighlight(step.type);
		this._updateDescription(step);
	}

	_updateDescription(step) {
		try {
			const el = document.getElementById("description-text");
			if (el && step.description) el.textContent = step.description;

			// 실생활 사례 표시 (done 스텝에서)
			if (step.type === "done" && this._currentScenario?.realWorld) {
				const rw = this._currentScenario.realWorld;
				if (!rw.icon || !rw.app || !rw.description) {
					console.warn("[Warning] incomplete realWorld data", rw);
					return;
				}
				const rwEl = document.getElementById("real-world-example");
				if (!rwEl) {
					console.warn("[Warning] real-world-example element not found");
					return;
				}
				rwEl.textContent = "";
				const iconSpan = document.createElement("span");
				iconSpan.className = "rw-icon";
				iconSpan.textContent = rw.icon;
				const appStrong = document.createElement("strong");
				appStrong.textContent = rw.app;
				const descText = document.createTextNode(`: ${rw.description}`);
				rwEl.appendChild(iconSpan);
				rwEl.appendChild(document.createTextNode(" "));
				rwEl.appendChild(appStrong);
				rwEl.appendChild(descText);
				rwEl.hidden = false;
			}
		} catch (err) {
			console.error("[Error] TutorialController._updateDescription:", err);
		}
	}

	_updateUI() {
		try {
			// 진행률
			const progress = this.graph.getProgress();
			const bar = document.getElementById("progress-bar");
			const indicator = document.getElementById("step-indicator");
			if (bar) bar.style.width = `${Math.round(progress * 100)}%`;
			if (indicator) {
				const cur = this.graph.currentIndex + 1;
				const total = this.graph.getTotalSteps();
				indicator.textContent = `Step ${cur} / ${total}`;
			}
			// 진행률 aria
			const progressContainer = document.querySelector(".progress-container");
			if (progressContainer) {
				progressContainer.setAttribute(
					"aria-valuenow",
					String(Math.round(progress * 100)),
				);
			}
		} catch (err) {
			console.error("[Error] TutorialController._updateUI:", err);
		}
	}

	_updatePlayButton(isPlaying) {
		try {
			const btn = document.getElementById("btn-play");
			if (!btn) return;
			btn.textContent = isPlaying ? "⏸" : "▶";
			btn.setAttribute("aria-label", isPlaying ? "일시정지" : "재생");
			btn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
		} catch (err) {
			console.error("[Error] TutorialController._updatePlayButton:", err);
		}
	}
}
