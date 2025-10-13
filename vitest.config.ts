import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/index.ts',
        'dist/',
      ],
    },
    mockReset: true,
    restoreMocks: true,
  },
});
