import eslint from '@eslint/js';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginJest from 'eslint-plugin-jest';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig} */
const c = tseslint.config(
  // Files to ignore
  {
    ignores: [
      '**/dist',
      'examples',
      'scratch',
      'coverage',
      'packages/core/types/test/*.js',
      'packages/react-native/android/build/reports',
      'packages/**/features',
      'packages/**/fixtures',
      'test/browser',
      'test/node',
      'test/react-native-cli/features/fixtures',
      'packages/react-native/ios/vendor',
      'test/cloudflare-workers'
    ],
  },
  eslint.configs.recommended,
  {
    rules: {
      'no-undef': 'warn',
      'no-unused-vars': 'warn',
      'no-empty': 'warn',
      'no-redeclare': 'warn',
      'no-func-assign': 'warn',
      'no-prototype-builtins': 'warn',
      'require-yield': 'warn',
    },
  },
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: eslintPluginImport,
      'custom-rules': require('./eslint-rules'),
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        /**
         * This config also targets files not included in tsconfig so this must be false
         * and rules requiring type information cannot be used
         */
        project: false,
      },
    },
  },
  // Base linting config
  {
    files: ['**/*.json', '**/*.[tj]s?(x)', '**/*.cjs', '**/*.mjs'],
  },
  // Node environment
  {
    files: ['jest/**/*.[js|mjs]', '**/*/babel.config.js', '**/*/rollup.config.mjs', '.rollup/index.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Linting config for TypeScript
  {
    files: [
      '**/*.ts?(x)'
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false, // Allows use of rules which require type information
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...tseslint.configs.recommended[1].rules,
      ...tseslint.configs.recommended[2].rules,
      ...tseslint.configs.strict[2].rules,

      // Let TypeScript inference work without being verbose
      '@typescript-eslint/explicit-function-return-type': 'off',

      // (Explicit) any has its valid use cases
      '@typescript-eslint/no-explicit-any': 'off',

      // We use noop functions liberally (() => {})
      '@typescript-eslint/no-empty-function': 'off',

      // This incorrectly fails on TypeScript method override signatures
      'no-dupe-class-members': 'off',

      // Optional chaining compiles to significantly more code and has limited IE support
      '@typescript-eslint/prefer-optional-chain': 'off',
      
      // Nullish coalescing also increases bundle size and has limited IE support
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

      // TypeScript 3.8 type compatibility rules
      // Prevent inline type imports like: import { type Module } from 'module'
      // These are TS 4.5+ syntax that may affect generated .d.ts files
      'import/consistent-type-specifier-style': ['warn', 'prefer-top-level'],

      // Prevent inline type exports like export { type Bugsnag }
      // These are TS 4.5+ syntax that may affect generated .d.ts files
      'custom-rules/no-inline-type-exports': 'warn',
      
      // General code quality rules (not TypeScript version-specific)
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'prefer-rest-params': 'warn',
      'prefer-spread': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-wrapper-object-types': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unsafe-declaration-merging': 'warn',
      '@typescript-eslint/no-invalid-void-type': 'warn',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/no-confusing-non-null-assertion': 'warn',
      
      /*
       * WARNING: No automated enforcement for type-breaking TS 4.0+ features!
       * 
       * The following type features will break TS 3.8 consumers but are NOT prevented:
       * - Variadic tuple types: type Foo<T extends any[]> = [...T, string]
       * - Labeled tuple elements: type Foo = [name: string, age: number]
       * - Template literal types: type EventName = `${string}Changed`
       * - Mapped type key remapping: { [K in keyof T as Uppercase<K>]: T[K] }
       * 
       * Mitigation strategies:
       * 1. Manual code review focusing on type definitions
       * 2. Expand test/browser/features/fixtures/typescript/3_8/ to import more packages
       * 3. Consider CI job that compiles published types with TypeScript 3.8
       */
      
      // Allow both 'as' and angle bracket assertions
      '@typescript-eslint/consistent-type-assertions': ['warn', {
        'assertionStyle': 'as',
        'objectLiteralTypeAssertions': 'allow'
      }],
    },
  },
  // Jest tests
  {
    files: [
      '**/*.test.ts?(x)'
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        ...globals.browser,
        process: 'readonly', // require to access process.env values
      },
    },
    plugins: {
      jest: eslintPluginJest,
    },
    rules: {
      ...eslintPluginJest.configs['flat/recommended'].rules,

      // Disable preferring Promise-based async tests
      'jest/no-test-callback': 'off',

      'jest/no-done-callback': 'warn',
      'jest/no-alias-methods': 'warn',
      'jest/no-conditional-expect': 'warn',
      'jest/valid-title': 'warn',
      'jest/no-standalone-expect': 'warn',
      'jest/no-deprecated-functions': 'warn',
      'no-var': 'warn',
    },
  },
);

export default c;
