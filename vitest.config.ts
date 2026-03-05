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
        statements: 88,
        branches: 74,
        functions: 85,
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
        // Heavy UI / hard to unit-test; keep coverage threshold on core lib and key components
        'src/components/admin/**',
        'src/components/book/BookView.tsx',
        'src/components/StorageGate.tsx',
        'src/lib/theme-init.ts',
        'src/components/ui/AdminButton.tsx',
        'src/components/ui/ImageLightbox.tsx',
        'src/lib/utils/color.ts',
        'src/components/book/BookToolbar.tsx',
        'src/components/content/PageContentRenderer.tsx',
      ],
    },
    globals: true,
  },
});
