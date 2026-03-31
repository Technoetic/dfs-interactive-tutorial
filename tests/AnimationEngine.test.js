import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnimationEngine } from '../src/classes/AnimationEngine.js';

describe('AnimationEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new AnimationEngine();
    vi.useFakeTimers();
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  describe('setSpeed / interval', () => {
    it('기본 배속은 1x, interval은 1200ms', () => {
      expect(engine.interval).toBe(1200);
    });

    it('2x 배속에서 interval은 600ms', () => {
      engine.setSpeed(2);
      expect(engine.interval).toBe(600);
    });

    it('0.5x 배속에서 interval은 2400ms', () => {
      engine.setSpeed(0.5);
      expect(engine.interval).toBe(2400);
    });
  });

  describe('stop / reset', () => {
    it('stop은 running 상태를 false로 만든다', () => {
      engine._running = true;
      engine.stop();
      expect(engine._running).toBe(false);
    });

    it('reset은 누적 시간을 초기화한다', () => {
      engine._accumulated = 500;
      engine._lastTime = 1000;
      engine.reset();
      expect(engine._accumulated).toBe(0);
      expect(engine._lastTime).toBeNull();
    });
  });

  describe('start', () => {
    it('start 후 _running이 true가 된다', () => {
      const mockRaf = vi.fn().mockReturnValue(1);
      vi.stubGlobal('requestAnimationFrame', mockRaf);
      engine.start(() => false);
      expect(engine._running).toBe(true);
      vi.unstubAllGlobals();
    });
  });

  describe('_tick', () => {
    beforeEach(() => {
      vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
      vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('누적 시간이 interval 미만이면 콜백을 호출하지 않는다', () => {
      const callback = vi.fn().mockReturnValue(true);
      engine._running = true;
      engine._callback = callback;
      engine._lastTime = 1000;
      engine._accumulated = 0;
      engine._tick = engine._tick.bind(engine);
      engine._tick(1500);   // delta = 500, accumulated = 500 < 1200
      expect(callback).not.toHaveBeenCalled();
    });

    it('누적 시간이 interval 이상이면 콜백을 호출한다', () => {
      const callback = vi.fn().mockReturnValue(true);
      engine._running = true;
      engine._callback = callback;
      engine._lastTime = 1000;
      engine._accumulated = 0;
      engine._tick = engine._tick.bind(engine);
      engine._tick(2300);   // delta = 1300, accumulated = 1300 >= 1200 → 콜백 호출
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('콜백이 false를 반환하면 stop을 호출한다', () => {
      const callback = vi.fn().mockReturnValue(false);
      engine._running = true;
      engine._callback = callback;
      // accumulated을 interval 직전으로 설정하고 충분한 delta로 트리거
      engine._lastTime = 1000;
      engine._accumulated = 1100; // interval(1200)까지 100ms 남음
      engine._tick = engine._tick.bind(engine);
      engine._tick(1200);   // delta = 200, accumulated = 1300 >= 1200 → callback() → false → stop
      expect(engine._running).toBe(false);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('콜백이 true를 반환하면 RAF를 재등록한다', () => {
      const rafMock = vi.fn().mockReturnValue(2);
      vi.stubGlobal('requestAnimationFrame', rafMock);
      const callback = vi.fn().mockReturnValue(true);
      engine._running = true;
      engine._callback = callback;
      engine._lastTime = 1000;
      engine._accumulated = 1100;
      engine._tick = engine._tick.bind(engine);
      rafMock.mockClear();
      engine._tick(1200);   // accumulated >= interval → callback() → true → RAF 재등록
      expect(rafMock).toHaveBeenCalled();
    });

    it('_running이 false이면 tick이 즉시 반환된다', () => {
      engine._running = false;
      const callback = vi.fn();
      engine._callback = callback;
      engine._tick(1000);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
