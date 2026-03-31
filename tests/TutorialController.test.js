// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TutorialController } from '../src/classes/TutorialController.js';

function makeController(overrides = {}) {
	const graph = {
		initialize: vi.fn(),
		goToFirst: vi.fn(() => ({ type: 'init', stack: [], description: 'Start' })),
		goToLast: vi.fn(() => ({ type: 'done', stack: [] })),
		nextStep: vi.fn(() => null),
		prevStep: vi.fn(() => null),
		isDone: vi.fn(() => false),
		getProgress: vi.fn(() => 0.5),
		currentIndex: 0,
		getTotalSteps: vi.fn(() => 10),
	};
	const visualizer = {
		initGraph: vi.fn(),
		renderStep: vi.fn(),
		updateStack: vi.fn(),
		updateCodeHighlight: vi.fn(),
	};
	const engine = {
		start: vi.fn(),
		stop: vi.fn(),
		reset: vi.fn(),
		setSpeed: vi.fn(),
	};
	const scenarios = [
		{ id: 'test', nodes: [], edges: [], startId: 'A' },
		{ id: 'auto', nodes: [], edges: [], startId: 'B', autoPlay: true, speed: 1.0 },
	];
	return {
		controller: new TutorialController({
			graph,
			visualizer,
			engine,
			scenarios,
			...overrides,
		}),
		graph,
		visualizer,
		engine,
		scenarios,
	};
}

describe('TutorialController', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<div id="progress-bar" style="width:0%"></div>
			<span id="step-indicator"></span>
			<div class="progress-container" aria-valuenow="0"></div>
			<button id="btn-play">▶</button>
			<p id="description-text"></p>
			<div id="real-world-example" hidden></div>
		`;
	});

	describe('constructor and initial state', () => {
		it('should initialize with state "IDLE"', () => {
			const { controller } = makeController();
			expect(controller.state).toBe('IDLE');
		});
	});

	describe('loadScenario', () => {
		it('should not do anything for non-existent id', () => {
			const { controller, graph, visualizer, engine } = makeController();
			controller.loadScenario('non-existent');
			expect(graph.initialize).not.toHaveBeenCalled();
			expect(visualizer.initGraph).not.toHaveBeenCalled();
		});

		it('should initialize graph and visualizer for valid id', () => {
			const { controller, graph, visualizer, engine } = makeController();
			controller.loadScenario('test');
			expect(graph.initialize).toHaveBeenCalledWith([], [], 'A');
			expect(visualizer.initGraph).toHaveBeenCalledWith([], []);
			expect(controller.state).toBe('IDLE');
		});

		it('should call engine.setSpeed and play for autoPlay scenario', () => {
			const { controller, graph, visualizer, engine } = makeController();
			const playSpy = vi.spyOn(controller, 'play');
			controller.loadScenario('auto');
			expect(engine.setSpeed).toHaveBeenCalledWith(1.0);
			expect(playSpy).toHaveBeenCalled();
			expect(controller.state).toBe('PLAYING');
		});

		it('should call goToFirst and apply the step', () => {
			const { controller, graph } = makeController();
			controller.loadScenario('test');
			expect(graph.goToFirst).toHaveBeenCalled();
		});

		it('should call engine.stop before loading', () => {
			const { controller, engine } = makeController();
			controller.loadScenario('test');
			expect(engine.stop).toHaveBeenCalled();
		});
	});

	describe('play', () => {
		it('should not play when state is DONE', () => {
			const { controller, engine } = makeController();
			controller.state = 'DONE';
			controller.play();
			expect(engine.start).not.toHaveBeenCalled();
		});

		it('should set state to PLAYING and call engine.start', () => {
			const { controller, engine } = makeController();
			controller.loadScenario('test');
			controller.state = 'PAUSED';
			controller.play();
			expect(controller.state).toBe('PLAYING');
			expect(engine.start).toHaveBeenCalled();
		});

		it('should update play button when playing', () => {
			const { controller } = makeController();
			const updatePlayButtonSpy = vi.spyOn(controller, '_updatePlayButton');
			controller.play();
			expect(updatePlayButtonSpy).toHaveBeenCalledWith(true);
		});
	});

	describe('pause', () => {
		it('should not pause if not in PLAYING state', () => {
			const { controller, engine } = makeController();
			controller.state = 'IDLE';
			controller.pause();
			expect(engine.stop).not.toHaveBeenCalled();
		});

		it('should set state to PAUSED and call engine.stop when PLAYING', () => {
			const { controller, engine } = makeController();
			controller.state = 'PLAYING';
			controller.pause();
			expect(controller.state).toBe('PAUSED');
			expect(engine.stop).toHaveBeenCalled();
		});

		it('should update play button when pausing', () => {
			const { controller } = makeController();
			const updatePlayButtonSpy = vi.spyOn(controller, '_updatePlayButton');
			controller.state = 'PLAYING';
			controller.pause();
			expect(updatePlayButtonSpy).toHaveBeenCalledWith(false);
		});
	});

	describe('togglePlay', () => {
		it('should call pause when state is PLAYING', () => {
			const { controller } = makeController();
			const pauseSpy = vi.spyOn(controller, 'pause');
			controller.state = 'PLAYING';
			controller.togglePlay();
			expect(pauseSpy).toHaveBeenCalled();
		});

		it('should call play when state is not PLAYING', () => {
			const { controller } = makeController();
			const playSpy = vi.spyOn(controller, 'play');
			controller.state = 'IDLE';
			controller.togglePlay();
			expect(playSpy).toHaveBeenCalled();
		});
	});

	describe('stepForward', () => {
		it('should not call visualizer when nextStep returns null', () => {
			const { controller, graph, visualizer } = makeController();
			controller.state = 'PLAYING';
			graph.nextStep.mockReturnValueOnce(null);
			controller.stepForward();
			expect(visualizer.renderStep).not.toHaveBeenCalled();
		});

		it('should call _applyStep when nextStep returns a valid step', () => {
			const { controller, graph } = makeController();
			controller.loadScenario('test');
			const testStep = { type: 'test', stack: [], description: 'Test' };
			graph.nextStep.mockReturnValueOnce(testStep);
			const applyStepSpy = vi.spyOn(controller, '_applyStep');
			controller.stepForward();
			expect(applyStepSpy).toHaveBeenCalledWith(testStep);
		});

		it('should pause before stepping forward', () => {
			const { controller } = makeController();
			const pauseSpy = vi.spyOn(controller, 'pause');
			controller.stepForward();
			expect(pauseSpy).toHaveBeenCalled();
		});

		it('should set state to DONE if isDone returns true', () => {
			const { controller, graph } = makeController();
			controller.loadScenario('test');
			const testStep = { type: 'test', stack: [] };
			graph.nextStep.mockReturnValueOnce(testStep);
			graph.isDone.mockReturnValueOnce(true);
			controller.stepForward();
			expect(controller.state).toBe('DONE');
		});
	});

	describe('stepBackward', () => {
		it('should call _applyStep when prevStep returns a valid step', () => {
			const { controller, graph } = makeController();
			controller.loadScenario('test');
			const testStep = { type: 'test', stack: [], description: 'Previous' };
			graph.prevStep.mockReturnValueOnce(testStep);
			const applyStepSpy = vi.spyOn(controller, '_applyStep');
			controller.stepBackward();
			expect(applyStepSpy).toHaveBeenCalledWith(testStep);
		});

		it('should not call visualizer when prevStep returns null', () => {
			const { controller, graph, visualizer } = makeController();
			graph.prevStep.mockReturnValueOnce(null);
			controller.stepBackward();
			expect(visualizer.renderStep).not.toHaveBeenCalled();
		});

		it('should set state to PAUSED after stepping backward', () => {
			const { controller, graph } = makeController();
			controller.loadScenario('test');
			const testStep = { type: 'test', stack: [] };
			graph.prevStep.mockReturnValueOnce(testStep);
			controller.stepBackward();
			expect(controller.state).toBe('PAUSED');
		});
	});

	describe('goToFirst', () => {
		it('should set state to IDLE', () => {
			const { controller } = makeController();
			controller.loadScenario('test');
			controller.state = 'PLAYING';
			controller.goToFirst();
			expect(controller.state).toBe('IDLE');
		});

		it('should call pause first', () => {
			const { controller } = makeController();
			const pauseSpy = vi.spyOn(controller, 'pause');
			controller.goToFirst();
			expect(pauseSpy).toHaveBeenCalled();
		});

		it('should call _applyStep with goToFirst result', () => {
			const { controller } = makeController();
			controller.loadScenario('test');
			const applyStepSpy = vi.spyOn(controller, '_applyStep');
			controller.goToFirst();
			expect(applyStepSpy).toHaveBeenCalled();
		});
	});

	describe('goToLast', () => {
		it('should set state to DONE', () => {
			const { controller } = makeController();
			controller.loadScenario('test');
			controller.state = 'PLAYING';
			controller.goToLast();
			expect(controller.state).toBe('DONE');
		});

		it('should call pause first', () => {
			const { controller } = makeController();
			const pauseSpy = vi.spyOn(controller, 'pause');
			controller.goToLast();
			expect(pauseSpy).toHaveBeenCalled();
		});

		it('should call _applyStep with goToLast result', () => {
			const { controller } = makeController();
			controller.loadScenario('test');
			const applyStepSpy = vi.spyOn(controller, '_applyStep');
			controller.goToLast();
			expect(applyStepSpy).toHaveBeenCalled();
		});
	});

	describe('reset', () => {
		it('should call engine.reset', () => {
			const { controller, engine } = makeController();
			controller.loadScenario('test');
			controller.reset();
			expect(engine.reset).toHaveBeenCalled();
		});

		it('should set state to IDLE', () => {
			const { controller } = makeController();
			controller.loadScenario('test');
			controller.state = 'PLAYING';
			controller.reset();
			expect(controller.state).toBe('IDLE');
		});

		it('should reload current scenario', () => {
			const { controller, graph } = makeController();
			controller.loadScenario('test');
			graph.initialize.mockClear();
			controller.reset();
			expect(graph.initialize).toHaveBeenCalled();
		});
	});

	describe('_applyStep', () => {
		it('should not call visualizer when step is null', () => {
			const { controller, visualizer } = makeController();
			controller._applyStep(null);
			expect(visualizer.renderStep).not.toHaveBeenCalled();
			expect(visualizer.updateStack).not.toHaveBeenCalled();
			expect(visualizer.updateCodeHighlight).not.toHaveBeenCalled();
		});

		it('should call visualizer methods for valid step', () => {
			const { controller, visualizer } = makeController();
			controller.loadScenario('test');
			const step = { type: 'test', stack: [1, 2], description: 'Test' };
			controller._applyStep(step);
			expect(visualizer.renderStep).toHaveBeenCalledWith(step, []);
			expect(visualizer.updateStack).toHaveBeenCalledWith([1, 2]);
			expect(visualizer.updateCodeHighlight).toHaveBeenCalledWith('test');
		});

		it('should call _updateDescription for valid step', () => {
			const { controller } = makeController();
			controller.loadScenario('test');
			const updateDescriptionSpy = vi.spyOn(controller, '_updateDescription');
			const step = { type: 'test', stack: [], description: 'Test' };
			controller._applyStep(step);
			expect(updateDescriptionSpy).toHaveBeenCalledWith(step);
		});
	});

	describe('_updateDescription', () => {
		it('should update description-text element', () => {
			const { controller } = makeController();
			const step = { type: 'test', description: 'New description' };
			controller._updateDescription(step);
			const el = document.getElementById('description-text');
			expect(el.textContent).toBe('New description');
		});

		it('should not throw error if description-text is missing', () => {
			const { controller } = makeController();
			document.getElementById('description-text').remove();
			const step = { type: 'test', description: 'Test' };
			expect(() => controller._updateDescription(step)).not.toThrow();
		});

		it('should show real-world example for done step', () => {
			const { controller } = makeController();
			controller.loadScenario('test');
			controller._currentScenario = {
				id: 'test',
				nodes: [],
				edges: [],
				startId: 'A',
				realWorld: {
					icon: '🔍',
					app: 'Binary Search',
					description: 'Used in search engines',
				},
			};
			const step = { type: 'done', stack: [], description: 'Done' };
			controller._updateDescription(step);
			const rwEl = document.getElementById('real-world-example');
			expect(rwEl.hidden).toBe(false);
			expect(rwEl.textContent).toContain('Binary Search');
		});

		it('should warn if realWorld data is incomplete', () => {
			const { controller } = makeController();
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			controller.loadScenario('test');
			controller._currentScenario.realWorld = { icon: '🔍' };
			const step = { type: 'done', stack: [] };
			controller._updateDescription(step);
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});

	describe('_updateUI', () => {
		it('should update progress bar width', () => {
			const { controller, graph } = makeController();
			graph.getProgress.mockReturnValueOnce(0.75);
			controller._updateUI();
			const bar = document.getElementById('progress-bar');
			expect(bar.style.width).toBe('75%');
		});

		it('should update step indicator text', () => {
			const { controller, graph } = makeController();
			graph.currentIndex = 5;
			graph.getTotalSteps.mockReturnValueOnce(10);
			controller._updateUI();
			const indicator = document.getElementById('step-indicator');
			expect(indicator.textContent).toBe('Step 6 / 10');
		});

		it('should update aria-valuenow attribute', () => {
			const { controller, graph } = makeController();
			graph.getProgress.mockReturnValueOnce(0.5);
			controller._updateUI();
			const progressContainer = document.querySelector('.progress-container');
			expect(progressContainer.getAttribute('aria-valuenow')).toBe('50');
		});

		it('should not throw error if progress-bar is missing', () => {
			const { controller } = makeController();
			document.getElementById('progress-bar').remove();
			expect(() => controller._updateUI()).not.toThrow();
		});

		it('should not throw error if step-indicator is missing', () => {
			const { controller } = makeController();
			document.getElementById('step-indicator').remove();
			expect(() => controller._updateUI()).not.toThrow();
		});

		it('should not throw error if progress-container is missing', () => {
			const { controller } = makeController();
			document.querySelector('.progress-container').remove();
			expect(() => controller._updateUI()).not.toThrow();
		});
	});

	describe('_updatePlayButton', () => {
		it('should update button text to ⏸ when playing', () => {
			const { controller } = makeController();
			controller._updatePlayButton(true);
			const btn = document.getElementById('btn-play');
			expect(btn.textContent).toBe('⏸');
		});

		it('should update button text to ▶ when not playing', () => {
			const { controller } = makeController();
			controller._updatePlayButton(false);
			const btn = document.getElementById('btn-play');
			expect(btn.textContent).toBe('▶');
		});

		it('should update aria-label for playing state', () => {
			const { controller } = makeController();
			controller._updatePlayButton(true);
			const btn = document.getElementById('btn-play');
			expect(btn.getAttribute('aria-label')).toBe('일시정지');
		});

		it('should update aria-label for paused state', () => {
			const { controller } = makeController();
			controller._updatePlayButton(false);
			const btn = document.getElementById('btn-play');
			expect(btn.getAttribute('aria-label')).toBe('재생');
		});

		it('should update aria-pressed attribute', () => {
			const { controller } = makeController();
			controller._updatePlayButton(true);
			const btn = document.getElementById('btn-play');
			expect(btn.getAttribute('aria-pressed')).toBe('true');
			controller._updatePlayButton(false);
			expect(btn.getAttribute('aria-pressed')).toBe('false');
		});

		it('should not throw error if btn-play is missing', () => {
			const { controller } = makeController();
			document.getElementById('btn-play').remove();
			expect(() => controller._updatePlayButton(true)).not.toThrow();
		});
	});

	describe('integration tests', () => {
		it('should handle full play-pause cycle', () => {
			const { controller, graph } = makeController();
			controller.loadScenario('test');
			expect(controller.state).toBe('IDLE');

			controller.play();
			expect(controller.state).toBe('PLAYING');

			controller.pause();
			expect(controller.state).toBe('PAUSED');

			controller.play();
			expect(controller.state).toBe('PLAYING');
		});

		it('should handle step navigation', () => {
			const { controller, graph } = makeController();
			controller.loadScenario('test');
			controller.state = 'PLAYING'; // stepForward → pause() 동작 위해 PLAYING 설정
			const step = { type: 'visit', stack: ['A'], description: 'Step' };
			graph.nextStep.mockReturnValueOnce(step);
			controller.stepForward();
			expect(controller.state).toBe('PAUSED');
		});

		it('should handle scenario reload on reset', () => {
			const { controller, graph } = makeController();
			controller.loadScenario('test');
			const initialCallCount = graph.initialize.mock.calls.length;
			controller.reset();
			expect(graph.initialize.mock.calls.length).toBeGreaterThan(initialCallCount);
		});
	});
});
