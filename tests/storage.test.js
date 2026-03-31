import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/utils/storage.js';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('set / get', () => {
    it('값을 저장하고 읽을 수 있다', () => {
      storage.set('test-key', 'hello');
      expect(storage.get('test-key')).toBe('hello');
    });

    it('숫자를 저장하고 읽을 수 있다', () => {
      storage.set('num', 42);
      expect(storage.get('num')).toBe(42);
    });

    it('객체를 저장하고 읽을 수 있다', () => {
      storage.set('obj', { a: 1, b: true });
      expect(storage.get('obj')).toEqual({ a: 1, b: true });
    });

    it('없는 키는 null을 반환한다', () => {
      expect(storage.get('nonexistent')).toBeNull();
    });

    it('dfs-tutorial:: 프리픽스를 사용한다', () => {
      storage.set('mykey', 'val');
      expect(localStorage.getItem('dfs-tutorial::mykey')).toBe('"val"');
    });
  });

  describe('remove', () => {
    it('저장된 값을 제거한다', () => {
      storage.set('del-key', 'value');
      storage.remove('del-key');
      expect(storage.get('del-key')).toBeNull();
    });
  });

  describe('에러 처리', () => {
    it('손상된 JSON은 null을 반환한다', () => {
      localStorage.setItem('dfs-tutorial::bad', 'not-json{');
      expect(storage.get('bad')).toBeNull();
    });
  });
});
