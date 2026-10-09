import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./e2e',use:{baseURL:process.env['FRONTEND_URL'] || 'http://localhost:4200',headless:true},reporter:'list',workers:1});
