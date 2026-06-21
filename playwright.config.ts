import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Read from .env file.
dotenv.config();

// Enforce test database to prevent wiping dev/prod data, and encode password @ symbol
process.env.DATABASE_URL = process.env.DATABASE_URL
  ?.replace('/propx?', '/propx_test?')
  .replace('Rahman@2005', 'Rahman%402005') || process.env.DATABASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // run tests sequentially to avoid DB collision
  reporter: 'html',
  globalSetup: require.resolve('./tests/global-setup'),
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120 * 1000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL || '',
    },
  },
});
