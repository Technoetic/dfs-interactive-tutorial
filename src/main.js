import { DFSGraph } from "./classes/DFSGraph.js";
import { DFSVisualizer } from "./classes/DFSVisualizer.js";
import { TutorialController } from "./classes/TutorialController.js";
import { AnimationEngine } from "./classes/AnimationEngine.js";
import { scenarios } from "./data/scenarios.js";
import { storage } from "./utils/storage.js";
import { $ } from "./utils/dom.js";
import { initErrorMonitoring, initPerfMonitoring } from "./utils/monitor.js";

// 프로덕션 모니터링 초기화
initErrorMonitoring();
initPerfMonitoring();

// 앱 초기화
const graph = new DFSGraph();
const visualizer = new DFSVisualizer("graph-svg");
const engine = new AnimationEngine();
const controller = new TutorialController({
	graph,
	visualizer,
	engine,
	scenarios,
});

// DOM 이벤트 연결 (요소 존재 확인)
const bindEvent = (selector, event, handler) => {
	const el = $(selector);
	if (!el) {
		console.warn(`[Warning] DOM element not found: ${selector}`);
		return;
	}
	el.addEventListener(event, handler);
};

bindEvent("#btn-play", "click", () => controller.togglePlay());
bindEvent("#btn-next", "click", () => controller.stepForward());
bindEvent("#btn-prev", "click", () => controller.stepBackward());
bindEvent("#btn-first", "click", () => controller.goToFirst());
bindEvent("#btn-last", "click", () => controller.goToLast());
bindEvent("#btn-reset", "click", () => controller.reset());
bindEvent("#speed-slider", "input", (e) => {
	const speed = parseFloat(e.target.value);
	engine.setSpeed(speed);
	const display = $("#speed-display");
	if (display) display.textContent = `${speed}x`;
	e.target.setAttribute("aria-valuenow", speed);
});
bindEvent("#scenario-select", "change", (e) => {
	controller.loadScenario(parseInt(e.target.value, 10), { suppressAutoPlay: true });
});
// 초기 시나리오 로드 (첫 화면은 자동 재생 억제)
controller.loadScenario(storage.get("last-scenario") || 0, { suppressAutoPlay: true });
