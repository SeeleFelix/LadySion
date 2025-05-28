import js from '@eslint/js';
import tsEslint from '@typescript-eslint/typescript-eslint';
import vuePlugin from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// 通用基础配置
const baseConfig = {
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // 通用规则
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
};

// TypeScript通用配置
const tsBaseConfig = {
  languageOptions: {
    parser: tsEslint.parser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  plugins: {
    '@typescript-eslint': tsEslint.plugin,
  },
  rules: {
    ...tsEslint.configs.recommended.rules,
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};

export default [
  // 全局忽略文件
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/.vscode/**',
      '**/.idea/**',
      'SillyTavern/**', // 忽略第三方项目
    ],
  },

  // JavaScript文件基础配置
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...js.configs.recommended,
    ...baseConfig,
  },

  // 前端配置 (Vue 3 + TypeScript)
  {
    files: ['client/**/*.{ts,js,vue}'],
    ...baseConfig,
    ...tsBaseConfig,
    languageOptions: {
      ...tsBaseConfig.languageOptions,
      parser: vueParser,
      parserOptions: {
        ...tsBaseConfig.languageOptions.parserOptions,
        parser: tsEslint.parser,
        extraFileExtensions: ['.vue'],
        project: ['./client/tsconfig.json'],
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        // 浏览器环境
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      ...tsBaseConfig.plugins,
      vue: vuePlugin,
    },
    rules: {
      ...baseConfig.rules,
      ...tsBaseConfig.rules,
      ...vuePlugin.configs['vue3-recommended'].rules,
      
      // Vue3 特定规则
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/component-tags-order': ['error', {
        order: ['script', 'template', 'style']
      }],
      
      // 前端特定规则
      'no-console': 'warn',
      'no-debugger': 'warn',
    },
  },

  // 后端配置 (Node.js + TypeScript)
  {
    files: ['server/**/*.{ts,js}'],
    ...baseConfig,
    ...tsBaseConfig,
    languageOptions: {
      ...tsBaseConfig.languageOptions,
      parserOptions: {
        ...tsBaseConfig.languageOptions.parserOptions,
        project: ['./server/tsconfig.json'],
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        // Node.js环境
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      ...baseConfig.rules,
      ...tsBaseConfig.rules,
      
      // 后端特定规则
      'no-console': 'off', // 后端允许console.log
      '@typescript-eslint/no-require-imports': 'off',
      
      // 导入规则
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message: '避免使用 export * 语法，请使用具名导出来提高代码可读性和tree-shaking效果'
        }
      ],
    },
  },

  // 共享类型文件配置
  {
    files: ['shared/**/*.{ts,js}'],
    ...baseConfig,
    ...tsBaseConfig,
    languageOptions: {
      ...tsBaseConfig.languageOptions,
      parserOptions: {
        ...tsBaseConfig.languageOptions.parserOptions,
        project: ['./shared/tsconfig.json', './client/tsconfig.json', './server/tsconfig.json'],
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      ...baseConfig.rules,
      ...tsBaseConfig.rules,
      // 类型定义文件的特殊规则
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-namespace': 'off',
    },
  },

  // 配置文件特殊处理
  {
    files: ['**/*.config.{js,ts,mjs,cjs}', '**/.*rc.{js,ts,mjs,cjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]; 