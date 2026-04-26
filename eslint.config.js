import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),

  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite, prettier],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-var': 'error', // varはエラー
      'no-unused-vars': 'warn', // 使っていない変数は警告
      'no-console': 'warn', // console.logは警告
      semi: ['error', 'always'], // 文末のセミコロンは必須
      quotes: ['error', 'single'], // 文字列はシングルクォートで囲む
      eqeqeq: ['error', 'always'], // 厳密な等価演算子を使用する ===を使用するってこと
      'prefer-const': 'error', // 再代入しない変数は let ではなく const で宣言することを強制する
    },
  },

  // Node用設定(vite.config.jsだけにあてるルール)
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {},
  },
]);
