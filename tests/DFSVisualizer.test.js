// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DFSVisualizer } from '../src/classes/DFSVisualizer.js';

describe('DFSVisualizer', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<svg id="graph-svg">
				<g id="edges-layer"></g>
				<g id="nodes-layer"></g>
			</svg>
			<div id="stack-display"></div>
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

	describe('constructor', () => {
		it('should call console.error when DOM elements are missing', () => {
			document.body.innerHTML = '';
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const visualizer = new DFSVisualizer('graph-svg');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"[Error] DFSVisualizer: Required DOM elements not found",
				expect.any(Object)
			);
			consoleErrorSpy.mockRestore();
		});

		it('should initialize correctly when DOM elements exist', () => {
			const visualizer = new DFSVisualizer('graph-svg');

			expect(visualizer.svg).toBeDefined();
			expect(visualizer.svg.id).toBe('graph-svg');
			expect(visualizer.edgesLayer).toBeDefined();
			expect(visualizer.edgesLayer.id).toBe('edges-layer');
			expect(visualizer.nodesLayer).toBeDefined();
			expect(visualizer.nodesLayer.id).toBe('nodes-layer');
			expect(visualizer.nodeRadius).toBe(26);
			expect(visualizer._nodeEls).toEqual({});
			expect(visualizer._edgeEls).toEqual({});
			expect(visualizer._activeEdgeId).toBeNull();
			expect(visualizer._codeLineEls).toBeNull();
			expect(visualizer._activeLineIdx).toBe(-1);
		});
	});

	describe('_getBoundingBox', () => {
		it('should calculate bounding box correctly', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [
				{ id: '1', x: 0, y: 0 },
				{ id: '2', x: 100, y: 50 },
				{ id: '3', x: 50, y: 100 }
			];

			const bbox = visualizer._getBoundingBox(nodes);

			expect(bbox.minX).toBe(0);
			expect(bbox.minY).toBe(0);
			expect(bbox.width).toBe(100);
			expect(bbox.height).toBe(100);
		});

		it('should handle negative coordinates', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [
				{ id: '1', x: -50, y: -30 },
				{ id: '2', x: 50, y: 70 }
			];

			const bbox = visualizer._getBoundingBox(nodes);

			expect(bbox.minX).toBe(-50);
			expect(bbox.minY).toBe(-30);
			expect(bbox.width).toBe(100);
			expect(bbox.height).toBe(100);
		});

		it('should handle single node', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [{ id: '1', x: 25, y: 25 }];

			const bbox = visualizer._getBoundingBox(nodes);

			expect(bbox.minX).toBe(25);
			expect(bbox.minY).toBe(25);
			expect(bbox.width).toBe(0);
			expect(bbox.height).toBe(0);
		});
	});

	describe('_stateLabel', () => {
		it('should return "미방문" for unvisited state', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			expect(visualizer._stateLabel('unvisited')).toBe('미방문');
		});

		it('should return "방문 중" for visiting state', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			expect(visualizer._stateLabel('visiting')).toBe('방문 중');
		});

		it('should return "방문 완료" for visited state', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			expect(visualizer._stateLabel('visited')).toBe('방문 완료');
		});

		it('should return "미방문" for unknown state', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			expect(visualizer._stateLabel('unknown')).toBe('미방문');
		});
	});

	describe('initGraph', () => {
		it('should return early when DOM elements are not initialized', () => {
			document.body.innerHTML = '';
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const visualizer = new DFSVisualizer('graph-svg');
			consoleErrorSpy.mockClear();

			visualizer.initGraph([], []);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"[Error] DFSVisualizer.initGraph: DOM elements not initialized"
			);
			consoleErrorSpy.mockRestore();
		});

		it('should create edges and nodes in layers', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [
				{ id: '1', x: 0, y: 0, label: 'A' },
				{ id: '2', x: 100, y: 100, label: 'B' }
			];
			const edges = [
				{ from: '1', to: '2' }
			];

			visualizer.initGraph(nodes, edges);

			const renderedEdges = visualizer.edgesLayer.querySelectorAll('line');
			const renderedNodes = visualizer.nodesLayer.querySelectorAll('g');

			expect(renderedEdges.length).toBe(1);
			expect(renderedNodes.length).toBe(2);
		});

		it('should clear previous elements on re-initialization', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes1 = [
				{ id: '1', x: 0, y: 0, label: 'A' }
			];
			const nodes2 = [
				{ id: '1', x: 0, y: 0, label: 'A' },
				{ id: '2', x: 100, y: 100, label: 'B' }
			];

			visualizer.initGraph(nodes1, []);
			expect(visualizer.nodesLayer.querySelectorAll('g').length).toBe(1);

			visualizer.initGraph(nodes2, []);
			expect(visualizer.nodesLayer.querySelectorAll('g').length).toBe(2);
		});

		it('should set viewBox based on bounding box', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [
				{ id: '1', x: 0, y: 0, label: 'A' },
				{ id: '2', x: 100, y: 100, label: 'B' }
			];

			visualizer.initGraph(nodes, []);

			const viewBox = visualizer.svg.getAttribute('viewBox');
			expect(viewBox).toBeDefined();
			expect(viewBox).toContain('-60'); // minX - 60
		});

		it('should reset internal state', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			visualizer._activeEdgeId = 'some-edge';
			visualizer._activeLineIdx = 5;

			visualizer.initGraph([], []);

			expect(visualizer._activeEdgeId).toBeNull();
			expect(visualizer._activeLineIdx).toBe(-1);
			expect(visualizer._nodeEls).toEqual({});
			expect(visualizer._edgeEls).toEqual({});
		});
	});

	describe('renderStep', () => {
		it('should return early when step is null', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [{ id: '1', x: 0, y: 0, label: 'A' }];
			visualizer.initGraph(nodes, []);

			expect(() => {
				visualizer.renderStep(null, nodes);
			}).not.toThrow();
		});

		it('should apply node-visited class to visited nodes', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [
				{ id: '1', x: 0, y: 0, label: 'A' },
				{ id: '2', x: 100, y: 100, label: 'B' }
			];
			visualizer.initGraph(nodes, []);

			const step = {
				visited: ['1'],
				nodeId: null,
				type: null,
				edgeId: null
			};
			visualizer.renderStep(step, nodes);

			const circle1 = visualizer._nodeEls['1'].querySelector('circle');
			expect(circle1.getAttribute('class')).toContain('node-visited');
		});

		it('should apply node-visiting and node-pulse classes to visiting nodes', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [
				{ id: '1', x: 0, y: 0, label: 'A' },
				{ id: '2', x: 100, y: 100, label: 'B' }
			];
			visualizer.initGraph(nodes, []);

			const step = {
				visited: [],
				nodeId: '1',
				type: 'visit',
				edgeId: null
			};
			visualizer.renderStep(step, nodes);

			const circle1 = visualizer._nodeEls['1'].querySelector('circle');
			expect(circle1.getAttribute('class')).toContain('node-visiting');
			expect(circle1.classList.contains('node-pulse')).toBe(true);
		});

		it('should remove node-pulse from non-visiting nodes', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [
				{ id: '1', x: 0, y: 0, label: 'A' }
			];
			visualizer.initGraph(nodes, []);

			const circle = visualizer._nodeEls['1'].querySelector('circle');
			circle.classList.add('node-pulse');

			const step = {
				visited: ['1'],
				nodeId: null,
				type: null,
				edgeId: null
			};
			visualizer.renderStep(step, nodes);

			expect(circle.classList.contains('node-pulse')).toBe(false);
		});

		it('should track _activeEdgeId and update edge-active class', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [
				{ id: '1', x: 0, y: 0, label: 'A' },
				{ id: '2', x: 100, y: 100, label: 'B' },
				{ id: '3', x: 200, y: 0, label: 'C' }
			];
			const edges = [
				{ from: '1', to: '2' },
				{ from: '2', to: '3' }
			];
			visualizer.initGraph(nodes, edges);

			const step1 = {
				visited: [],
				nodeId: null,
				type: null,
				edgeId: '1-2'
			};
			visualizer.renderStep(step1, nodes);
			expect(visualizer._activeEdgeId).toBe('1-2');
			expect(visualizer._edgeEls['1-2'].classList.contains('edge-active')).toBe(true);

			const step2 = {
				visited: [],
				nodeId: null,
				type: null,
				edgeId: '2-3'
			};
			visualizer.renderStep(step2, nodes);
			expect(visualizer._activeEdgeId).toBe('2-3');
			expect(visualizer._edgeEls['1-2'].classList.contains('edge-active')).toBe(false);
			expect(visualizer._edgeEls['2-3'].classList.contains('edge-active')).toBe(true);
		});

		it('should remove edge-active class when edgeId becomes null', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const nodes = [
				{ id: '1', x: 0, y: 0, label: 'A' },
				{ id: '2', x: 100, y: 100, label: 'B' }
			];
			const edges = [
				{ from: '1', to: '2' }
			];
			visualizer.initGraph(nodes, edges);

			const step1 = {
				visited: [],
				nodeId: null,
				type: null,
				edgeId: '1-2'
			};
			visualizer.renderStep(step1, nodes);
			expect(visualizer._edgeEls['1-2'].classList.contains('edge-active')).toBe(true);

			const step2 = {
				visited: [],
				nodeId: null,
				type: null,
				edgeId: null
			};
			visualizer.renderStep(step2, nodes);
			expect(visualizer._edgeEls['1-2'].classList.contains('edge-active')).toBe(false);
			expect(visualizer._activeEdgeId).toBeNull();
		});
	});

	describe('updateStack', () => {
		it('should clear innerHTML when stack is empty', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const display = document.getElementById('stack-display');
			display.innerHTML = '<div>old content</div>';

			visualizer.updateStack([]);

			expect(display.innerHTML).toBe('');
		});

		it('should display stack items in reverse order', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const display = document.getElementById('stack-display');

			visualizer.updateStack(['A', 'B', 'C']);

			const items = display.querySelectorAll('.stack-item');
			expect(items.length).toBe(3);
			expect(items[0].textContent).toBe('C'); // top of stack
			expect(items[1].textContent).toBe('B');
			expect(items[2].textContent).toBe('A'); // bottom of stack
		});

		it('should apply stack-top class only to first item', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const display = document.getElementById('stack-display');

			visualizer.updateStack(['A', 'B', 'C']);

			const items = display.querySelectorAll('.stack-item');
			expect(items[0].classList.contains('stack-top')).toBe(true);
			expect(items[1].classList.contains('stack-top')).toBe(false);
			expect(items[2].classList.contains('stack-top')).toBe(false);
		});

		it('should set role attribute to listitem', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			const display = document.getElementById('stack-display');

			visualizer.updateStack(['A']);

			const item = display.querySelector('.stack-item');
			expect(item.getAttribute('role')).toBe('listitem');
		});

		it('should return early when stack-display element does not exist', () => {
			document.getElementById('stack-display').remove();
			const visualizer = new DFSVisualizer('graph-svg');

			expect(() => {
				visualizer.updateStack(['A', 'B']);
			}).not.toThrow();
		});
	});

	describe('updateCodeHighlight', () => {
		it('should cache code-line elements on first call', () => {
			const visualizer = new DFSVisualizer('graph-svg');
			expect(visualizer._codeLineEls).toBeNull();

			visualizer.updateCodeHighlight('init');

			expect(visualizer._codeLineEls).not.toBeNull();
			expect(visualizer._codeLineEls.length).toBe(9);
		});

		it('should apply active-line class to correct line for init', () => {
			const visualizer = new DFSVisualizer('graph-svg');

			visualizer.updateCodeHighlight('init');

			expect(visualizer._codeLineEls[0].classList.contains('active-line')).toBe(true);
			expect(visualizer._activeLineIdx).toBe(0);
		});

		it('should apply active-line class to correct line for visit', () => {
			const visualizer = new DFSVisualizer('graph-svg');

			visualizer.updateCodeHighlight('visit');

			expect(visualizer._codeLineEls[2].classList.contains('active-line')).toBe(true);
			expect(visualizer._activeLineIdx).toBe(2);
		});

		it('should apply active-line class to correct line for push', () => {
			const visualizer = new DFSVisualizer('graph-svg');

			visualizer.updateCodeHighlight('push');

			expect(visualizer._codeLineEls[4].classList.contains('active-line')).toBe(true);
			expect(visualizer._activeLineIdx).toBe(4);
		});

		it('should apply active-line class to correct line for skip', () => {
			const visualizer = new DFSVisualizer('graph-svg');

			visualizer.updateCodeHighlight('skip');

			expect(visualizer._codeLineEls[6].classList.contains('active-line')).toBe(true);
			expect(visualizer._activeLineIdx).toBe(6);
		});

		it('should apply active-line class to correct line for done', () => {
			const visualizer = new DFSVisualizer('graph-svg');

			visualizer.updateCodeHighlight('done');

			expect(visualizer._codeLineEls[8].classList.contains('active-line')).toBe(true);
			expect(visualizer._activeLineIdx).toBe(8);
		});

		it('should toggle active-line class when switching between lines', () => {
			const visualizer = new DFSVisualizer('graph-svg');

			visualizer.updateCodeHighlight('init');
			expect(visualizer._codeLineEls[0].classList.contains('active-line')).toBe(true);

			visualizer.updateCodeHighlight('visit');
			expect(visualizer._codeLineEls[0].classList.contains('active-line')).toBe(false);
			expect(visualizer._codeLineEls[2].classList.contains('active-line')).toBe(true);
		});

		it('should handle unknown stepType with -1 index', () => {
			const visualizer = new DFSVisualizer('graph-svg');

			visualizer.updateCodeHighlight('unknown-type');

			expect(visualizer._activeLineIdx).toBe(-1);
		});

		it('should remove active-line from previous line when activating unknown type', () => {
			const visualizer = new DFSVisualizer('graph-svg');

			visualizer.updateCodeHighlight('init');
			expect(visualizer._codeLineEls[0].classList.contains('active-line')).toBe(true);

			visualizer.updateCodeHighlight('unknown-type');
			expect(visualizer._codeLineEls[0].classList.contains('active-line')).toBe(false);
			expect(visualizer._activeLineIdx).toBe(-1);
		});

		it('should handle null/undefined stepType gracefully', () => {
			const visualizer = new DFSVisualizer('graph-svg');

			visualizer.updateCodeHighlight(null);

			expect(visualizer._activeLineIdx).toBe(-1);
		});

		it('should not throw when code-line elements do not exist', () => {
			document.querySelectorAll('.code-line').forEach(el => el.remove());
			const visualizer = new DFSVisualizer('graph-svg');

			expect(() => {
				visualizer.updateCodeHighlight('init');
			}).not.toThrow();

			expect(visualizer._codeLineEls.length).toBe(0);
		});
	});
});
