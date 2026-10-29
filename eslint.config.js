'use strict';

const js = require('@eslint/js');
const security = require('eslint-plugin-security');
const globals = require('globals');

// Primera capa de SAST: reglas de seguridad de eslint-plugin-security.
// El script "lint" usa --max-warnings 0, así que cualquier hallazgo detiene el pipeline.
module.exports = [
  { ignores: ['node_modules/', 'coverage/', 'reportes/', 'dist/'] },
  js.configs.recommended,
  security.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: globals.jest },
  },
];
