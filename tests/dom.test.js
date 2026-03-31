import { describe, it, expect } from 'vitest';
import { $ } from '../src/utils/dom.js';

describe('dom utilities', () => {
  describe('$', () => {
    it('첫 번째 매칭 요소를 반환한다', () => {
      document.body.innerHTML = '<div id="foo"></div>';
      expect($('#foo')).not.toBeNull();
    });

    it('없는 선택자는 null을 반환한다', () => {
      document.body.innerHTML = '';
      expect($('#nonexistent')).toBeNull();
    });
  });
});
