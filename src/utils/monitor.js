/**
 * monitor.js — 클라이언트 사이드 성능 & 에러 모니터링
 * 프로덕션 환경에서 window.onerror, PerformanceObserver로 지표 수집
 */

const LOG_KEY = "dfs-monitor-log";
const MAX_ENTRIES = 50;

function _save(entry) {
	try {
		const existing = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
		existing.push(entry);
		if (existing.length > MAX_ENTRIES) existing.splice(0, existing.length - MAX_ENTRIES);
		localStorage.setItem(LOG_KEY, JSON.stringify(existing));
	} catch {
		// 스토리지 실패 무시
	}
}

/** 에러 모니터링 초기화 */
export function initErrorMonitoring() {
	window.addEventListener("error", (e) => {
		_save({
			type: "error",
			msg: e.message,
			src: e.filename,
			line: e.lineno,
			ts: Date.now(),
		});
	});

	window.addEventListener("unhandledrejection", (e) => {
		_save({
			type: "unhandledrejection",
			msg: String(e.reason),
			ts: Date.now(),
		});
	});
}

/** Web Vitals 측정 (LCP, CLS, FID) */
export function initPerfMonitoring() {
	if (!("PerformanceObserver" in window)) return;

	// LCP
	try {
		new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const last = entries[entries.length - 1];
			_save({ type: "LCP", value: Math.round(last.startTime), ts: Date.now() });
		}).observe({ type: "largest-contentful-paint", buffered: true });
	} catch {
		// 미지원 브라우저 무시
	}

	// CLS
	try {
		let cls = 0;
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const ls = /** @type {any} */ (entry);
				if (!ls.hadRecentInput) cls += ls.value;
			}
			_save({ type: "CLS", value: Math.round(cls * 1000) / 1000, ts: Date.now() });
		}).observe({ type: "layout-shift", buffered: true });
	} catch {
		// 미지원 브라우저 무시
	}

	// Navigation Timing
	window.addEventListener("load", () => {
		setTimeout(() => {
			const nav = /** @type {any} */ (performance.getEntriesByType("navigation")[0]);
			if (nav) {
				_save({
					type: "navigation",
					ttfb: Math.round(nav.responseStart - nav.requestStart),
					domLoad: Math.round(nav.domContentLoadedEventEnd),
					load: Math.round(nav.loadEventEnd),
					ts: Date.now(),
				});
			}
		}, 0);
	});
}

/** 수집된 로그 반환 */
export function getMonitorLog() {
	try {
		return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
	} catch {
		return [];
	}
}
