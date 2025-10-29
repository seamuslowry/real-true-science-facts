// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';

// If you're using TypeScript, also:
// import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  // Next's flat presets come as arrays — spread them at the top level
  ...nextCoreWebVitals,
  // ...nextTs, // uncomment if using TS rules from Next

  // ESLint's official JS flat preset
  js.configs.recommended,

  // Your project rules / plugins
  {
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'error'
    }
  },

  // Optional ignores (flat config style)
  {
    ignores: ['.next/**', 'out/**', 'build/**']
  }
]);
