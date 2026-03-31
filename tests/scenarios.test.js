import { describe, it, expect } from 'vitest';
import { scenarios } from '../src/data/scenarios.js';

describe('scenarios', () => {
  it('7개의 시나리오가 존재한다', () => {
    expect(scenarios.length).toBe(7);
  });

  it('각 시나리오는 id, nodes, edges, startId를 가진다', () => {
    scenarios.forEach(s => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('nodes');
      expect(s).toHaveProperty('edges');
      expect(s).toHaveProperty('startId');
    });
  });

  it('id는 0부터 6까지 순서대로 있다', () => {
    expect(scenarios.map(s => s.id)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('각 시나리오의 nodes는 비어있지 않다', () => {
    scenarios.forEach(s => {
      expect(s.nodes.length).toBeGreaterThan(0);
    });
  });

  it('startId는 nodes 중 하나의 id다', () => {
    scenarios.forEach(s => {
      const nodeIds = s.nodes.map(n => n.id);
      expect(nodeIds).toContain(s.startId);
    });
  });

  it('각 edge의 from/to는 nodes에 존재한다', () => {
    scenarios.forEach(s => {
      const nodeIds = new Set(s.nodes.map(n => n.id));
      s.edges.forEach(e => {
        expect(nodeIds.has(e.from)).toBe(true);
        expect(nodeIds.has(e.to)).toBe(true);
      });
    });
  });
});
