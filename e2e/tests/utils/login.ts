import type { Page } from "@playwright/test";

export async function login(page: Page) {
  await page.goto('/login');

  const emailField = page.getByPlaceholder('Tài khoản');
  await emailField.fill('motorstaff@bimsua.me');

  const passwordField = page.getByPlaceholder('Mật khẩu');
  await passwordField.fill('motorstaff@bimsua.me');

  const loginButton = page.getByRole('button', { name: 'ĐĂNG NHẬP' });
  await loginButton.click();

  await page.waitForLoadState('networkidle');
}
