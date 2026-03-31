const PREFIX = "dfs-tutorial::";

export const storage = {
	get(key) {
		try {
			const val = localStorage.getItem(PREFIX + key);
			return val !== null ? JSON.parse(val) : null;
		} catch {
			return null;
		}
	},
	set(key, value) {
		try {
			localStorage.setItem(PREFIX + key, JSON.stringify(value));
		} catch {
			// 스토리지 용량 초과 등 무시
		}
	},
	remove(key) {
		localStorage.removeItem(PREFIX + key);
	},
};
