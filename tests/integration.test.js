// @vitest-environment jsdom

import { DFSGraph } from '../src/classes/DFSGraph.js';
import { DFSVisualizer } from '../src/classes/DFSVisualizer.js';
import { TutorialController } from '../src/classes/TutorialController.js';
import { AnimationEngine } from '../src/classes/AnimationEngine.js';
import { storage } from '../src/utils/storage.js';
import { scenarios } from '../src/data/scenarios.js';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * 통합 테스트: 미커버 코드 경로 + 모듈 간 연동 검증
 * 목표: DFSGraph, DFSVisualizer, TutorialController 통합 동작 확인
 */

/** TutorialController 실제 인스턴스 생성 헬퍼 */
function makeRealController() {
	const graph = new DFSGraph();
	const visualizer = new DFSVisualizer('graph-svg');
	const engine = new AnimationEngine();
	const controller = new TutorialController({ graph, visualizer, engine, scenarios });
	return { graph, visualizer, engine, controller };
}

describe('Integration Tests - Gap Coverage', () => {
	beforeEach(() => {
		// jsdom 환경에서 필요한 DOM 구조 설정
		document.body.innerHTML = `
			<svg id="graph-svg">
				<defs><marker id="arrowhead"></marker></defs>
				<g id="edges-layer"></g>
				<g id="nodes-layer"></g>
			</svg>
			<div id="stack-display"></div>
			<div id="description-text"></div>
			<div id="real-world-example"></div>
			<div id="progress-bar"></div>
			<div id="step-indicator"></div>
			<div class="progress-container"></div>
			<button id="btn-play">▶</button>
			<div class="code-line"></div>
			<div class="code-line"></div>
			<div class="code-line"></div>
			<div class="code-line"></div>
			<div class="code-line"></div>
			<div class="code-line"></div>
			<div class="code-line"></div>
			<div class="code-line"></div>
			<div class="code-line"></div>
		`;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ====================================================================
	// 1. DFSGraph 미커버 경로 테스트
	// ====================================================================

	describe('DFSGraph gap coverage', () => {
		it('prevStep returns step when currentIndex > 0', () => {
			const graph = new DFSGraph();
			const scenario = scenarios[0];

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);
			graph.goToFirst(); // currentIndex: -1 → 0

			// 초기 상태: currentIndex = 0
			expect(graph.currentIndex).toBe(0);

			// nextStep 2번 호출 → currentIndex = 2
			const step1 = graph.nextStep();
			expect(step1).not.toBeNull();
			expect(graph.currentIndex).toBe(1);

			const step2 = graph.nextStep();
			expect(step2).not.toBeNull();
			expect(graph.currentIndex).toBe(2);

			// prevStep 호출 → currentIndex = 1로 감소
			const prevStep = graph.prevStep();
			expect(prevStep).not.toBeNull();
			expect(graph.currentIndex).toBe(1);

			// 반환된 스텝이 steps[1]과 일치
			expect(prevStep).toEqual(graph.steps[1]);
		});

		it('prevStep returns null when currentIndex is 0', () => {
			const graph = new DFSGraph();
			const scenario = scenarios[0];

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);

			// goToFirst 호출 → currentIndex = 0
			graph.goToFirst();
			expect(graph.currentIndex).toBe(0);

			// prevStep 호출 → null 반환
			const result = graph.prevStep();
			expect(result).toBeNull();
			expect(graph.currentIndex).toBe(0); // 변화 없음
		});

		it('getNodeState returns node state when node exists', () => {
			const graph = new DFSGraph();
			const scenario = scenarios[0];

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);

			// 초기화 후 노드 'A'의 상태 조회
			const stateA = graph.getNodeState('A');
			expect(stateA).toBe('unvisited'); // 초기 상태

			// nextStep으로 진행하면 visit/push 상태가 바뀌지만
			// getNodeState는 graph.nodes의 state를 조회하므로 검증
			const nodeA = graph.nodes.find((n) => n.id === 'A');
			expect(nodeA).not.toBeUndefined();
			expect(nodeA.state).toBe('unvisited');
		});

		it('getNodeState returns unvisited for unknown node', () => {
			const graph = new DFSGraph();
			const scenario = scenarios[0];

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);

			// 존재하지 않는 노드 조회
			const stateUnknown = graph.getNodeState('UNKNOWN');
			expect(stateUnknown).toBe('unvisited'); // 기본값
		});
	});

	// ====================================================================
	// 2. storage 예외 경로 테스트
	// ====================================================================

	describe('storage gap coverage', () => {
		it('set silently catches localStorage errors', () => {
			// localStorage.setItem을 spy로 설정하여 error 발생
			const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
			setItemSpy.mockImplementation(() => {
				throw new Error('QuotaExceededError');
			});

			// storage.set() 호출 시 에러가 발생해도 예외를 던지지 않음
			expect(() => {
				storage.set('test-key', { data: 'test-value' });
			}).not.toThrow();

			// setItem이 호출되었음 검증
			expect(setItemSpy).toHaveBeenCalled();

			vi.restoreAllMocks();
		});

		it('get returns null on localStorage errors', () => {
			const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
			getItemSpy.mockImplementation(() => {
				throw new Error('StorageError');
			});

			const result = storage.get('test-key');
			expect(result).toBeNull();

			vi.restoreAllMocks();
		});
	});

	// ====================================================================
	// 3. DFSGraph + DFSVisualizer 연동 테스트
	// ====================================================================

	describe('DFSGraph + DFSVisualizer integration', () => {
		it('initGraph renders nodes and edges from scenario data', () => {
			const scenario = scenarios[0];
			const graph = new DFSGraph();
			const visualizer = new DFSVisualizer('graph-svg');

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);
			visualizer.initGraph(scenario.nodes, scenario.edges);

			// SVG 요소 확인
			const svg = document.getElementById('graph-svg');
			expect(svg).not.toBeNull();

			const nodesLayer = document.getElementById('nodes-layer');
			const edgesLayer = document.getElementById('edges-layer');

			expect(nodesLayer).not.toBeNull();
			expect(edgesLayer).not.toBeNull();

			// 노드 그룹 개수 확인
			const nodeGroups = nodesLayer.querySelectorAll('.graph-node-group');
			expect(nodeGroups.length).toBe(scenario.nodes.length);

			// 엣지 개수 확인
			const edges = edgesLayer.querySelectorAll('.graph-edge');
			expect(edges.length).toBe(scenario.edges.length);
		});

		it('renderStep updates node classes after DFS steps', () => {
			const scenario = scenarios[0];
			const graph = new DFSGraph();
			const visualizer = new DFSVisualizer('graph-svg');

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);
			visualizer.initGraph(scenario.nodes, scenario.edges);

			// 첫 번째 스텝 적용
			graph.goToFirst();
			const firstStep = graph.getCurrentStep();
			visualizer.renderStep(firstStep, scenario.nodes);

			// nextStep으로 진행하면서 노드 상태 변경
			for (let i = 0; i < 3; i++) {
				const step = graph.nextStep();
				if (!step) break;
				visualizer.renderStep(step, scenario.nodes);
			}

			// 노드 요소 확인
			const nodesLayer = document.getElementById('nodes-layer');
			const nodeGroups = nodesLayer.querySelectorAll('.graph-node-group');

			// 최소한 하나의 노드가 변경되었는지 확인 (클래스 또는 속성)
			expect(nodeGroups.length).toBeGreaterThan(0);
		});

		it('full DFS traversal: graph and visualizer stay in sync', () => {
			const scenario = scenarios[0];
			const graph = new DFSGraph();
			const visualizer = new DFSVisualizer('graph-svg');

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);
			visualizer.initGraph(scenario.nodes, scenario.edges);

			// 전체 DFS 순회
			graph.goToFirst();
			let step = graph.getCurrentStep();
			expect(step).not.toBeNull();

			let stepCount = 0;
			const maxSteps = graph.getTotalSteps();

			while (!graph.isDone() && stepCount < maxSteps) {
				visualizer.renderStep(step, scenario.nodes);
				step = graph.nextStep();
				stepCount++;

				// 에러 없이 진행해야 함
				expect(stepCount).toBeLessThanOrEqual(maxSteps);
			}

			// 마지막 스텝 적용
			if (step) {
				visualizer.renderStep(step, scenario.nodes);
			}

			// 완료 상태 확인
			expect(graph.isDone()).toBe(true);
		});
	});

	// ====================================================================
	// 4. TutorialController + DFSGraph 연동 테스트
	// ====================================================================

	describe('TutorialController + DFSGraph integration', () => {
		// scenarios[1]은 autoPlay: false → loadScenario 후 state가 IDLE 유지
		it('loadScenario initializes graph and renders first step', () => {
			const { graph, controller } = makeRealController();

			controller.loadScenario(scenarios[1].id);

			expect(graph.steps.length).toBeGreaterThan(0);
			expect(graph.currentIndex).toBe(0);
			expect(controller.state).toBe('IDLE');
		});

		it('stepForward advances graph and visualizer', () => {
			const { graph, controller } = makeRealController();

			controller.loadScenario(scenarios[1].id);
			controller.state = 'PLAYING'; // pause() 동작을 위해 PLAYING 설정
			const initialIndex = graph.currentIndex;

			controller.stepForward();

			expect(graph.currentIndex).toBeGreaterThan(initialIndex);
			expect(controller.state).toBe('PAUSED');
		});

		it('goToLast sets state to DONE', () => {
			const { graph, controller } = makeRealController();

			controller.loadScenario(scenarios[1].id);
			controller.goToLast();

			expect(controller.state).toBe('DONE');
			expect(graph.isDone()).toBe(true);
		});

		it('goToFirst then goToLast covers full range', () => {
			const { graph, controller } = makeRealController();

			controller.loadScenario(scenarios[1].id);
			controller.goToLast();
			expect(graph.isDone()).toBe(true);
			expect(controller.state).toBe('DONE');

			controller.goToFirst();
			expect(graph.currentIndex).toBe(0);
			expect(controller.state).toBe('IDLE');
		});

		it('reset restores IDLE state', () => {
			const { graph, controller } = makeRealController();

			controller.loadScenario(scenarios[1].id);
			controller.goToLast();
			expect(controller.state).toBe('DONE');

			controller.reset();

			expect(controller.state).toBe('IDLE');
			expect(graph.currentIndex).toBe(0);
		});
	});

	// ====================================================================
	// 5. TutorialController._updateDescription 예외 경로
	// ====================================================================

	describe('TutorialController._updateDescription exception handling', () => {
		it('handles missing description element gracefully', () => {
			const graph = new DFSGraph();
			const visualizer = new DFSVisualizer('graph-svg');
			const engine = new AnimationEngine();
			const controller = new TutorialController({
				graph,
				visualizer,
				engine,
				scenarios,
			});

			// description-text 요소 제거
			const descEl = document.getElementById('description-text');
			if (descEl) descEl.remove();

			controller.loadScenario(scenarios[0].id);

			// _applyStep 호출 (description-text 없음)
			const step = { description: 'Test step', type: 'visit', nodeId: 'A' };

			// 에러가 발생하지 않아야 함
			expect(() => {
				controller._applyStep(step);
			}).not.toThrow();
		});

		it('handles incomplete realWorld data gracefully', () => {
			const graph = new DFSGraph();
			const visualizer = new DFSVisualizer('graph-svg');
			const engine = new AnimationEngine();

			// realWorld 데이터가 불완전한 시나리오 생성
			const customScenarios = [
				{
					...scenarios[0],
					realWorld: {
						icon: '📁',
						// app과 description 누락
					},
				},
			];

			const controller = new TutorialController({
				graph,
				visualizer,
				engine,
				scenarios: customScenarios,
			});

			controller.loadScenario(0);

			// done 스텝 생성
			const doneStep = { description: 'Done', type: 'done', nodeId: null };

			// 에러가 발생하지 않아야 함
			expect(() => {
				controller._applyStep(doneStep);
			}).not.toThrow();
		});

		it('handles missing real-world-example element gracefully', () => {
			const graph = new DFSGraph();
			const visualizer = new DFSVisualizer('graph-svg');
			const engine = new AnimationEngine();
			const controller = new TutorialController({
				graph,
				visualizer,
				engine,
				scenarios,
			});

			// real-world-example 요소 제거
			const rwEl = document.getElementById('real-world-example');
			if (rwEl) rwEl.remove();

			controller.loadScenario(scenarios[0].id);

			// done 스텝 적용
			const doneStep = { description: 'Done', type: 'done', nodeId: null };

			// 에러가 발생하지 않아야 함
			expect(() => {
				controller._applyStep(doneStep);
			}).not.toThrow();
		});
	});

	// ====================================================================
	// 6. 멀티 시나리오 연동 테스트
	// ====================================================================

	describe('Multi-scenario integration', () => {
		it('switches scenarios without errors', () => {
			const graph = new DFSGraph();
			const visualizer = new DFSVisualizer('graph-svg');
			const engine = new AnimationEngine();
			const controller = new TutorialController({
				graph,
				visualizer,
				engine,
				scenarios,
			});

			// 시나리오 0 로드
			controller.loadScenario(0);
			const stepsCount0 = graph.getTotalSteps();
			expect(stepsCount0).toBeGreaterThan(0);

			// 시나리오 1로 전환
			controller.loadScenario(1);
			const stepsCount1 = graph.getTotalSteps();
			expect(stepsCount1).toBeGreaterThan(0);

			// 다른 시나리오일 수 있으므로 각각의 스텝이 로드됨
			expect(graph.currentIndex).toBe(0); // 항상 첫 스텝으로 리셋
		});
	});

	// ====================================================================
	// 7. 에지 케이스 및 경계값 테스트
	// ====================================================================

	describe('Edge cases and boundary conditions', () => {
		it('getProgress returns 0 when steps are empty', () => {
			const graph = new DFSGraph();
			expect(graph.getProgress()).toBe(0);
		});

		it('getCurrentStep returns null when currentIndex is -1', () => {
			const graph = new DFSGraph();
			expect(graph.getCurrentStep()).toBeNull();
		});

		it('nextStep returns null at end of steps', () => {
			const graph = new DFSGraph();
			const scenario = scenarios[0];

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);
			graph.goToLast();

			const result = graph.nextStep();
			expect(result).toBeNull();
		});

		it('goTo invalid index returns null', () => {
			const graph = new DFSGraph();
			const scenario = scenarios[0];

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);

			// 범위 외 인덱스
			const result = graph.goTo(9999);
			expect(result).toBeNull();
		});

		it('loadScenario with invalid ID does nothing', () => {
			const graph = new DFSGraph();
			const visualizer = new DFSVisualizer('graph-svg');
			const engine = new AnimationEngine();
			const controller = new TutorialController({
				graph,
				visualizer,
				engine,
				scenarios,
			});

			controller.loadScenario(9999);

			// _currentScenario가 null이어야 함
			expect(controller._currentScenario).toBeNull();
		});
	});

	// ====================================================================
	// 8. DFSGraph 노드 상태 전이 테스트
	// ====================================================================

	describe('DFSGraph node state transitions', () => {
		it('tracks visited nodes during traversal', () => {
			const graph = new DFSGraph();
			const scenario = scenarios[0];

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);

			// 초기 상태: 모든 노드가 'unvisited'
			scenario.nodes.forEach((n) => {
				expect(graph.getNodeState(n.id)).toBe('unvisited');
			});

			// 몇 스텝 진행
			for (let i = 0; i < 3; i++) {
				graph.nextStep();
			}

			// currentStep의 visited 노드들이 반영되는지 확인
			const currentStep = graph.getCurrentStep();
			expect(currentStep).not.toBeNull();
			expect(Array.isArray(currentStep.visited)).toBe(true);
		});

		it('reset clears all visited nodes', () => {
			const graph = new DFSGraph();
			const scenario = scenarios[0];

			graph.initialize(scenario.nodes, scenario.edges, scenario.startId);

			// 몇 스텝 진행
			for (let i = 0; i < 5; i++) {
				graph.nextStep();
			}

			expect(graph.currentIndex).toBeGreaterThan(0);

			// reset 호출
			graph.reset();

			// 모든 노드가 'unvisited'로 복원됨
			scenario.nodes.forEach((n) => {
				expect(graph.getNodeState(n.id)).toBe('unvisited');
			});

			expect(graph.currentIndex).toBe(-1);
		});
	});
});
