// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

// Hand-rolled flat config, replacing eslint-config-next.
// Background: eslint-config-next@16.x transitively depends on eslint-plugin-react@7.x,
// which crashes on ESLint 10 (vercel/next.js#89764). We pull Next's lint signal
// directly from @next/eslint-plugin-next instead, and use @eslint-react as the
// ESLint 10-ready React rule set.
export default defineConfig([
  // TypeScript recommended rules (parser + base + recommended)
  ...tseslint.configs.recommended,

  // Next.js core-web-vitals rules — registers the @next/next plugin and its rules
  nextPlugin.configs['core-web-vitals'],

  // React + react-hooks + Prettier — applied to every JS/TS source file
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx}'],
    extends: [eslintReact.configs.recommended],
    plugins: {
      'react-hooks': reactHooks,
      prettier
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'prettier/prettier': 'error'
    }
  },

  // Disable stylistic ESLint rules that conflict with Prettier — must come last
  prettierConfig,

  // Keep the same global ignores as before (.next/**, out/**, build/**)
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts'])
]);
