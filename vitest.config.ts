import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    pool: 'threads',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      thresholds: {
        statements: 90,
        branches: 79,
        functions: 90,
        lines: 90,
      },
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'next-env.d.ts',
        '**/index.ts',
        'src/app/**',
        'src/lib/types/**',
        'src/middleware.ts',
        'src/components/SetDocumentLang.tsx',
        'src/components/LocalePreferenceRedirect.tsx',
        'src/components/ui/PageColorPickerClient.tsx',
        'src/components/ui/PageColorPicker.tsx',
        'src/components/ui/LocaleSwitcher.tsx',
      ],
    },
    globals: true,
  },
});
