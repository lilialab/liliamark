import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/**', 'src-tauri/**', 'node_modules/**']),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', '*.config.ts', 'eslint.config.js'],
    plugins: {
      unicorn: eslintPluginUnicorn,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // 强制纯类型导入必须显式写出 `import type`
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // 禁止在代码中留下毫无意义的 `any` 漏斗
      '@typescript-eslint/no-explicit-any': 'warn',

      // 严禁对可能为 `undefined` 或 `null` 的值进行非空断言（禁止使用 `obj!.prop`）
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 强制要求数组声明统一使用 `T[]` 而不是 `Array<T>`
      '@typescript-eslint/array-type': ['error', { default: 'array' }],

      // Hooks：只锁经典两条（本仓未启用 React Compiler，不开 v7 recommended 全套）
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // 强制要求组件中所有自闭合标签必须写成 `<Component />`
      'react/self-closing-comp': ['error', { component: true, html: true }],

      // 变量声明了必须使用（排除了 JS 层的重复检查，启用 TS 层深度检查）
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // 生产环境禁止残留调试输出；只放行 warn / error
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',

      // 与 separate-type-imports 并存：同模块的 value / type 分两条 import 不算重复
      // （若改用 inline-type-imports，可改回开启 no-duplicate-imports）
      'no-duplicate-imports': 'off',

      // 禁止 == / !=，统一使用 === / !==
      eqeqeq: 'error',

      // 禁止代码中出现完全无意义的自我比较（如 `if (x === x)`）
      'no-self-compare': 'error',

      // 禁止在普通对象中使用无意义的重复 Key 值
      'no-dupe-keys': 'error',

      // 可读性优先：仅禁止 for...in；map/filter/reduce 为默认倾向（不强制），顺序 await 优先 for...of
      // ES2023 非破坏性数组方法由下方 unicorn 规则约束（不开 recommended）
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message:
            '避免 for...in；可用 Object.keys/entries/values + 数组方法，或 for...of（可读性优先）。',
        },
      ],

      'unicorn/no-array-sort': ['error', { allowExpressionStatement: false }],
      'unicorn/no-array-reverse': ['error', { allowExpressionStatement: false }],
      'unicorn/no-array-splice': 'error',
      'unicorn/no-confusing-array-splice': 'error',
      'unicorn/prefer-at': 'error',
    },
  },
  // 关闭与外部格式化工具（dprint）冲突的 ESLint 样式规则
  eslintConfigPrettier,
);
