/**
 * AnimationEngine — requestAnimationFrame 기반 타이밍 제어
 * 상태: IDLE | RUNNING | PAUSED
 */
export class AnimationEngine {
	constructor() {
		this._speed = 1.0; // 배속 (0.5 ~ 3.0)
		this._baseInterval = 1200; // ms, 1x 기준
		this._rafId = null;
		this._lastTime = null;
		this._accumulated = 0;
		this._callback = null;
		this._running = false;
	}

	setSpeed(multiplier) {
		this._speed = multiplier;
	}

	get interval() {
		return this._baseInterval / this._speed;
	}

	start(callback) {
		this._callback = callback;
		this._running = true;
		this._lastTime = null;
		this._accumulated = 0;
		this._tick = this._tick.bind(this);
		this._rafId = requestAnimationFrame(this._tick);
	}

	_tick(timestamp) {
		if (!this._running) return;
		if (!this._lastTime) this._lastTime = timestamp;
		const delta = timestamp - this._lastTime;
		this._lastTime = timestamp;
		this._accumulated += delta;

		if (this._accumulated >= this.interval) {
			this._accumulated -= this.interval;
			const hasNext = this._callback();
			if (!hasNext) {
				this.stop();
				return;
			}
		}
		this._rafId = requestAnimationFrame(this._tick);
	}

	stop() {
		this._running = false;
		if (this._rafId) {
			cancelAnimationFrame(this._rafId);
			this._rafId = null;
		}
	}

	reset() {
		this.stop();
		this._lastTime = null;
		this._accumulated = 0;
	}
}
