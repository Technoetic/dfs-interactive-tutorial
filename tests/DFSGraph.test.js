import { describe, it, expect, beforeEach } from 'vitest';
import { DFSGraph } from '../src/classes/DFSGraph.js';

const NODES = [
  { id: 'A', label: 'A', x: 200, y: 100 },
  { id: 'B', label: 'B', x: 100, y: 250 },
  { id: 'C', label: 'C', x: 300, y: 250 },
];
const EDGES = [
  { from: 'A', to: 'B' },
  { from: 'A', to: 'C' },
];

describe('DFSGraph', () => {
  let graph;

  beforeEach(() => {
    graph = new DFSGraph();
  });

  describe('initialize', () => {
    it('노드를 unvisited 상태로 초기화한다', () => {
      graph.initialize(NODES, EDGES, 'A');
      expect(graph.nodes.every(n => n.state === 'unvisited')).toBe(true);
    });

    it('steps 배열을 생성한다', () => {
      graph.initialize(NODES, EDGES, 'A');
      expect(graph.steps.length).toBeGreaterThan(0);
    });

    it('첫 스텝은 init 타입이다', () => {
      graph.initialize(NODES, EDGES, 'A');
      expect(graph.steps[0].type).toBe('init');
    });

    it('마지막 스텝은 done 타입이다', () => {
      graph.initialize(NODES, EDGES, 'A');
      const last = graph.steps[graph.steps.length - 1];
      expect(last.type).toBe('done');
    });
  });

  describe('nextStep / prevStep', () => {
    beforeEach(() => graph.initialize(NODES, EDGES, 'A'));

    it('nextStep은 currentIndex를 증가시킨다', () => {
      const step = graph.nextStep();
      expect(step).not.toBeNull();
      expect(graph.currentIndex).toBe(0);
    });

    it('prevStep은 첫 스텝에서 null을 반환한다', () => {
      graph.goToFirst();
      const step = graph.prevStep();
      expect(step).toBeNull();
    });

    it('nextStep은 마지막 스텝에서 null을 반환한다', () => {
      graph.goToLast();
      const step = graph.nextStep();
      expect(step).toBeNull();
    });
  });

  describe('goToFirst / goToLast', () => {
    beforeEach(() => graph.initialize(NODES, EDGES, 'A'));

    it('goToFirst는 첫 스텝을 반환한다', () => {
      graph.nextStep();
      graph.nextStep();
      const step = graph.goToFirst();
      expect(step.type).toBe('init');
      expect(graph.currentIndex).toBe(0);
    });

    it('goToLast는 마지막 스텝을 반환한다', () => {
      const step = graph.goToLast();
      expect(step.type).toBe('done');
    });
  });

  describe('goTo', () => {
    beforeEach(() => graph.initialize(NODES, EDGES, 'A'));

    it('유효한 인덱스로 점프한다', () => {
      const step = graph.goTo(1);
      expect(step).not.toBeNull();
      expect(graph.currentIndex).toBe(1);
    });

    it('범위 밖 인덱스는 null을 반환한다', () => {
      expect(graph.goTo(-1)).toBeNull();
      expect(graph.goTo(9999)).toBeNull();
    });
  });

  describe('isDone', () => {
    beforeEach(() => graph.initialize(NODES, EDGES, 'A'));

    it('마지막 스텝에 도달하면 true를 반환한다', () => {
      graph.goToLast();
      expect(graph.isDone()).toBe(true);
    });

    it('초기 상태에서는 false를 반환한다', () => {
      expect(graph.isDone()).toBe(false);
    });
  });

  describe('getProgress', () => {
    beforeEach(() => graph.initialize(NODES, EDGES, 'A'));

    it('스텝이 없으면 0을 반환한다', () => {
      const empty = new DFSGraph();
      expect(empty.getProgress()).toBe(0);
    });

    it('마지막 스텝에서 1을 반환한다', () => {
      graph.goToLast();
      expect(graph.getProgress()).toBe(1);
    });
  });

  describe('getTotalSteps', () => {
    it('초기화 후 steps 수를 반환한다', () => {
      graph.initialize(NODES, EDGES, 'A');
      expect(graph.getTotalSteps()).toBe(graph.steps.length);
    });
  });

  describe('reset', () => {
    it('currentIndex를 -1로 초기화한다', () => {
      graph.initialize(NODES, EDGES, 'A');
      graph.nextStep();
      graph.reset();
      expect(graph.currentIndex).toBe(-1);
    });
  });

  describe('DFS 알고리즘 정확성', () => {
    it('모든 노드가 방문된다', () => {
      graph.initialize(NODES, EDGES, 'A');
      const done = graph.steps[graph.steps.length - 1];
      expect(done.visited).toContain('A');
      expect(done.visited).toContain('B');
      expect(done.visited).toContain('C');
    });

    it('사이클이 있어도 무한 루프 없이 완료된다', () => {
      const cycleEdges = [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'C', to: 'A' },
      ];
      graph.initialize(NODES, cycleEdges, 'A');
      const done = graph.steps[graph.steps.length - 1];
      expect(done.type).toBe('done');
    });
  });
});
