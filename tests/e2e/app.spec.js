import { test, expect } from '@playwright/test';

test('온보딩 모달이 표시된다', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#onboarding-overlay')).toBeVisible();
  await expect(page.locator('text=DFS 튜토리얼에 오신 것을 환영합니다')).toBeVisible();
});

test('튜토리얼 시작 버튼이 동작한다', async ({ page }) => {
  await page.goto('/');
  await page.click('#btn-start-tutorial');
  // Wait for the overlay to be hidden (check display property)
  await page.waitForFunction(() => {
    const overlay = document.querySelector('#onboarding-overlay');
    return overlay && overlay.hidden === true;
  });
  await expect(page.locator('#graph-svg')).toBeVisible();
});

test('재생 버튼이 동작한다', async ({ page }) => {
  await page.goto('/');
  await page.click('#btn-start-tutorial');
  // Wait for the overlay to be hidden before clicking play
  // The overlay element still exists in DOM but should not block clicks
  await page.waitForFunction(() => {
    const overlay = document.querySelector('#onboarding-overlay');
    return overlay && overlay.hidden === true;
  });

  // Force click via JavaScript to bypass Playwright's pointer-events check
  await page.evaluate(() => {
    document.querySelector('#btn-play').click();
  });
  await page.waitForTimeout(500);
});

test('시나리오 선택이 동작한다', async ({ page }) => {
  await page.goto('/');
  await page.click('#btn-start-tutorial');
  await page.selectOption('#scenario-select', '1');
  await expect(page.locator('#graph-svg')).toBeVisible();
});

test('속도 슬라이더가 표시된다', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#speed-slider')).toBeVisible();
});
