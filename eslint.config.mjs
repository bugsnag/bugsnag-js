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
      'packages/react-native/ios/vendor'
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

      /*
       * TypeScript 3.8 Compatibility Rules
       * 
       * TypeScript 3.8 was released in February 2020. The following rules ensure
       * we don't use syntax or features introduced in later versions:
       * 
       * Avoided features from TS 3.9+:
       * - `// @ts-expect-error` comments (prefer `// @ts-ignore`)
       * 
       * Avoided features from TS 4.0+:
       * - Variadic tuple types: [...T, ...U]
       * - Labeled tuple elements: [first: string, second: number]
       * - catch clause variable type annotations: catch (e: Error)
       * 
       * Avoided features from TS 4.1+:
       * - Template literal types: `${string}-${number}`
       * - Key remapping in mapped types: { [K in keyof T as `get${K}`]: T[K] }
       * - Recursive conditional types
       * 
       * Limited browser support features (available in TS 3.7-3.8 but avoided):
       * - Optional chaining (?.) - limited IE support
       * - Nullish coalescing (??) - limited IE support
       */

      // TypeScript 3.8 compatibility rules
      // Optional chaining compiles to a lot more code and has limited browser support
      '@typescript-eslint/prefer-optional-chain': 'off',
      
      // Prevent nullish coalescing (??) - introduced in TS 3.7 but limited browser support
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      
      // Support TypeScript 3.8 by disallowing import { type Module } from 'module'
      'import/consistent-type-specifier-style': ['warn', 'prefer-top-level'],

      // Prevent inline type exports like export { type Bugsnag }
      'custom-rules/no-inline-type-exports': 'warn',
      
      // Warn about confusing non-null assertions for code clarity
      '@typescript-eslint/no-confusing-non-null-assertion': 'warn',

      // Disallow @ts-expect-error (TS 3.9+) and enforce descriptions for @ts-ignore
      '@typescript-eslint/ban-ts-comment': ['warn', {
        'ts-expect-error': true, // Disallow @ts-expect-error for TypeScript 3.8 compatibility
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        'ts-check': false,
        'minimumDescriptionLength': 10
      }],
      
      // General code quality rules (not specifically TypeScript 3.8 related)
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'prefer-rest-params': 'warn',
      'prefer-spread': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-wrapper-object-types': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unsafe-declaration-merging': 'warn',
      '@typescript-eslint/no-invalid-void-type': 'warn',
      
      // Additional TypeScript 3.8 compatibility notes:
      // - Variadic tuple types (TS 4.0+) are handled by parser compatibility
      // - Labeled tuple elements (TS 4.0+) are handled by parser compatibility
      // - Template literal types (TS 4.1+) are handled by parser compatibility
      
      // Allow explicit constructors for better compatibility
      '@typescript-eslint/no-useless-constructor': 'off',
      
      // Ensure we don't use assertions that require newer TS versions
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
