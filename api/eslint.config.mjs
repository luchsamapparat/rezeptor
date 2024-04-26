// @ts-check

import eslint from '@eslint/js';
import exportScopePlugin from 'eslint-plugin-export-scope';
import * as importPlugin from 'eslint-plugin-import';
import * as unusedImportsPlugin from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**/*']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      // spreading is a workaround for Error: Key "plugins": Key "export-scope": Expected an object.
      'export-scope': { ...exportScopePlugin },
      'import': importPlugin,
      'unused-imports': unusedImportsPlugin
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn'
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    rules: {
      // Don't leak local utils, states, contexts, components into the global scope (https://github.com/A-Shleifman/eslint-plugin-export-scope)
      'export-scope/no-imports-outside-export-scope': 'error',

      // Enforce linebreaks after opening and before closing array brackets (https://eslint.org/docs/latest/rules/array-bracket-newline)
      'array-bracket-newline': ['warn', 'consistent'],

      // Enforce consistent spacing inside array brackets (https://eslint.org/docs/latest/rules/array-bracket-spacing)
      'array-bracket-spacing': ['warn', 'never'],

      // Enforce line breaks after each array element (https://eslint.org/docs/latest/rules/array-element-newline)
      'array-element-newline': ['off'],

      // Require parentheses around arrow function arguments (https://eslint.org/docs/latest/rules/arrow-parens)
      'arrow-parens': ['warn', 'as-needed'],

      // Enforce consistent spacing before and after the arrow in arrow functions (https://eslint.org/docs/latest/rules/arrow-spacing)
      'arrow-spacing': ['warn'],

      // Disallow or enforce spaces inside of blocks after opening block and before closing block (https://eslint.org/docs/latest/rules/block-spacing)
      'block-spacing': ['warn', 'always'],

      // Enforce consistent brace style for blocks (https://eslint.org/docs/latest/rules/brace-style)
      'brace-style': ['warn', '1tbs'],

      // Require or disallow trailing commas (https://eslint.org/docs/latest/rules/comma-dangle)
      'comma-dangle': ['off', 'always-multiline'],

      // Enforce consistent spacing before and after commas (https://eslint.org/docs/latest/rules/comma-spacing)
      'comma-spacing': ['warn'],

      // Enforce consistent comma style (https://eslint.org/docs/latest/rules/comma-style)
      'comma-style': ['warn'],

      // Enforce consistent spacing inside computed property brackets (https://eslint.org/docs/latest/rules/computed-property-spacing)
      'computed-property-spacing': ['warn'],

      // Enforce consistent newlines before and after dots (https://eslint.org/docs/latest/rules/dot-location)
      'dot-location': ['warn', 'property'],

      // Require or disallow newline at the end of files (https://eslint.org/docs/latest/rules/eol-last)
      'eol-last': ['warn'],

      // Require or disallow spacing between function identifiers and their invocations (https://eslint.org/docs/latest/rules/func-call-spacing)
      'func-call-spacing': ['warn'],

      // Enforce line breaks between arguments of a function call (https://eslint.org/docs/latest/rules/function-call-argument-newline)
      'function-call-argument-newline': ['warn', 'consistent'],

      // Enforce consistent line breaks inside function parentheses (https://eslint.org/docs/latest/rules/function-paren-newline)
      'function-paren-newline': ['warn', 'consistent'],

      // Enforce consistent spacing around `*` operators in generator functions (https://eslint.org/docs/latest/rules/generator-star-spacing)
      'generator-star-spacing': ['warn'],

      // Enforce the location of arrow function bodies (https://eslint.org/docs/latest/rules/implicit-arrow-linebreak)
      'implicit-arrow-linebreak': ['warn'],

      // Enforce consistent indentation (https://eslint.org/docs/latest/rules/indent)
      'indent': ['warn', 2, { 'SwitchCase': 1 }],

      // Enforce the consistent use of either double or single quotes in JSX attributes (https://eslint.org/docs/latest/rules/jsx-quotes)
      'jsx-quotes': ['warn', 'prefer-double'],

      // Enforce consistent spacing between keys and values in object literal properties (https://eslint.org/docs/latest/rules/key-spacing)
      'key-spacing': ['warn'],

      // Enforce consistent spacing before and after keywords (https://eslint.org/docs/latest/rules/keyword-spacing)
      'keyword-spacing': ['warn'],

      // Enforce position of line comments (https://eslint.org/docs/latest/rules/line-comment-position)
      'line-comment-position': ['off'],

      // Enforce consistent linebreak style (https://eslint.org/docs/latest/rules/linebreak-style)
      'linebreak-style': ['off'],

      // Require empty lines around comments (https://eslint.org/docs/latest/rules/lines-around-comment)
      'lines-around-comment': ['off'],

      // Require or disallow an empty line between class members (https://eslint.org/docs/latest/rules/lines-between-class-members)
      'lines-between-class-members': ['warn'],

      // Enforce a maximum line length (https://eslint.org/docs/latest/rules/max-len)
      'max-len': ['off'],

      // Enforce a maximum number of statements allowed per line (https://eslint.org/docs/latest/rules/max-statements-per-line)
      'max-statements-per-line': ['warn', { 'max': 2 }],

      // Enforce newlines between operands of ternary expressions (https://eslint.org/docs/latest/rules/multiline-ternary)
      'multiline-ternary': ['off'],

      // Enforce or disallow parentheses when invoking a constructor with no arguments (https://eslint.org/docs/latest/rules/new-parens)
      'new-parens': ['warn'],

      // Require a newline after each call in a method chain (https://eslint.org/docs/latest/rules/newline-per-chained-call)
      'newline-per-chained-call': [
        'warn',
        { 'ignoreChainWithDepth': 2 }
      ],

      // Disallow unnecessary parentheses (https://eslint.org/docs/latest/rules/no-extra-parens)
      'no-extra-parens': ['off'],

      // Disallow mixed spaces and tabs for indentation (https://eslint.org/docs/latest/rules/no-mixed-spaces-and-tabs)
      'no-mixed-spaces-and-tabs': ['warn'],

      // Disallow multiple spaces (https://eslint.org/docs/latest/rules/no-multi-spaces)
      'no-multi-spaces': ['warn'],

      // Disallow multiple empty lines (https://eslint.org/docs/latest/rules/no-multiple-empty-lines)
      'no-multiple-empty-lines': [
        'warn',
        { 'max': 2, 'maxBOF': 0, 'maxEOF': 1 }
      ],

      // Disallow variable redeclaration (https://eslint.org/docs/latest/rules/no-redeclare)
      'no-redeclare': ['off'],

      // Disallow all tabs (https://eslint.org/docs/latest/rules/no-tabs)
      'no-tabs': ['off'],

      // Disallow trailing whitespace at the end of lines (https://eslint.org/docs/latest/rules/no-trailing-spaces)
      'no-trailing-spaces': ['warn'],

      // Disallow unused variables (https://eslint.org/docs/latest/rules/no-unused-vars)
      'no-unused-vars': ['off'],

      // Disallow whitespace before properties (https://eslint.org/docs/latest/rules/no-whitespace-before-property)
      'no-whitespace-before-property': ['warn'],

      // Enforce the location of single-line statements (https://eslint.org/docs/latest/rules/nonblock-statement-body-position)
      'nonblock-statement-body-position': ['warn'],

      // Enforce consistent line breaks after opening and before closing braces (https://eslint.org/docs/latest/rules/object-curly-newline)
      'object-curly-newline': ['warn', { 'consistent': true }],

      // Enforce consistent spacing inside braces (https://eslint.org/docs/latest/rules/object-curly-spacing)
      'object-curly-spacing': ['warn', 'always'],

      // Enforce placing object properties on separate lines (https://eslint.org/docs/latest/rules/object-property-newline)
      'object-property-newline': ['off'],

      // Enforce consistent linebreak style for operators (https://eslint.org/docs/latest/rules/operator-linebreak)
      'operator-linebreak': [
        'warn',
        'after',
        { 'overrides': { '?': 'ignore', ':': 'ignore' } }
      ],

      // Require or disallow padding within blocks (https://eslint.org/docs/latest/rules/padded-blocks)
      'padded-blocks': ['off'],

      // Require or disallow padding lines between statements (https://eslint.org/docs/latest/rules/padding-line-between-statements)
      'padding-line-between-statements': ['off'],

      // Enforce the consistent use of either backticks, double, or single quotes (https://eslint.org/docs/latest/rules/quotes)
      'quotes': ['warn', 'single'],

      // Enforce spacing between rest and spread operators and their expressions (https://eslint.org/docs/latest/rules/rest-spread-spacing)
      'rest-spread-spacing': ['warn', 'never'],

      // Require or disallow semicolons instead of ASI (https://eslint.org/docs/latest/rules/semi)
      'semi': ['warn', 'always'],

      // Enforce consistent spacing before and after semicolons (https://eslint.org/docs/latest/rules/semi-spacing)
      'semi-spacing': ['warn'],

      // Enforce location of semicolons (https://eslint.org/docs/latest/rules/semi-style)
      'semi-style': ['warn'],

      // Enforce consistent spacing before blocks (https://eslint.org/docs/latest/rules/space-before-blocks)
      'space-before-blocks': ['warn', 'always'],

      // Enforce consistent spacing before `function` definition opening parenthesis (https://eslint.org/docs/latest/rules/space-before-function-paren)
      'space-before-function-paren': [
        'warn',
        {
          'anonymous': 'always',
          'named': 'never',
          'asyncArrow': 'always'
        }
      ],

      // Enforce consistent spacing inside parentheses (https://eslint.org/docs/latest/rules/space-in-parens)
      'space-in-parens': ['warn'],

      // Require spacing around infix operators (https://eslint.org/docs/latest/rules/space-infix-ops)
      'space-infix-ops': ['warn'],

      // Enforce consistent spacing before or after unary operators (https://eslint.org/docs/latest/rules/space-unary-ops)
      'space-unary-ops': ['warn'],

      // Enforce spacing around colons of switch statements (https://eslint.org/docs/latest/rules/switch-colon-spacing)
      'switch-colon-spacing': ['warn'],

      // Require or disallow spacing around embedded expressions of template strings (https://eslint.org/docs/latest/rules/template-curly-spacing)
      'template-curly-spacing': ['warn'],

      // Require or disallow spacing between template tags and their literals (https://eslint.org/docs/latest/rules/template-tag-spacing)
      'template-tag-spacing': ['warn'],

      // Require or disallow Unicode byte order mark (BOM) (https://eslint.org/docs/latest/rules/unicode-bom)
      'unicode-bom': ['warn'],

      // Require parentheses around immediate `function` invocations (https://eslint.org/docs/latest/rules/wrap-iife)
      'wrap-iife': ['warn', 'inside'],

      // Require parenthesis around regex literals (https://eslint.org/docs/latest/rules/wrap-regex)
      'wrap-regex': ['off'],

      // Require or disallow spacing around the `*` in `yield*` expressions (https://eslint.org/docs/latest/rules/yield-star-spacing)
      'yield-star-spacing': ['warn'],

      // Disallow specified modules when loaded by import (https://eslint.org/docs/latest/rules/no-restricted-imports)
      'no-restricted-imports': [
        'error',
        {
          'name': 'lodash',
          'message': 'Please use lodash-es instead.'
        },
        {
          'name': '@faker-js/faker',
          'message': '@faker-js/faker/locale/de'
        },
        {
          'name': '@abb-emobility/common/ui',
          'message': 'Only @abb-emobility/marketplace/ui must be used.'
        }
      ],

      // Reports if a resolved path is imported more than once (https://github.com/import-js/eslint-plugin-import/blob/9fd3c42707d71987e439a847f2e213f55c84f734/docs/rules/no-duplicates.md)
      'import/no-duplicates': ['warn'],

      // Do not allow unused imports (https://github.com/sweepline/eslint-plugin-unused-imports/blob/master/docs/rules/no-unused-imports.md)
      'unused-imports/no-unused-imports': 'error',

      // Require that function overload signatures be consecutive (https://typescript-eslint.io/rules/adjacent-overload-signatures)
      '@typescript-eslint/adjacent-overload-signatures': ['warn'],

      // Require consistently using either T[] or Array<T> for arrays (https://typescript-eslint.io/rules/array-type)
      '@typescript-eslint/array-type': [
        'warn',
        { 'default': 'array', 'readonly': 'array' }
      ],

      // Require or disallow the Record type (https://typescript-eslint.io/rules/consistent-indexed-object-style)
      '@typescript-eslint/consistent-indexed-object-style': ['warn'],

      // Enforce type definitions to consistently use either interface or type (https://typescript-eslint.io/rules/consistent-type-assertions)
      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        { 'assertionStyle': 'as' }
      ],

      // type (https://typescript-eslint.io/rules/consistent-type-definitions)
      '@typescript-eslint/consistent-type-definitions': [
        'warn',
        'type'
      ],

      // Enforce consistent usage of type imports (https://typescript-eslint.io/rules/consistent-type-imports)
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { 'prefer': 'type-imports' }
      ],

      // Require a specific member delimiter style for interfaces and type literals (https://typescript-eslint.io/rules/member-delimiter-style)
      '@typescript-eslint/member-delimiter-style': ['warn'],

      // Enforce using a particular method signature syntax (https://typescript-eslint.io/rules/method-signature-style)
      '@typescript-eslint/method-signature-style': [
        'warn',
        'property'
      ],

      // Disallow non-null assertion in locations that may be confusing (https://typescript-eslint.io/rules/no-confusing-non-null-assertion)
      '@typescript-eslint/no-confusing-non-null-assertion': ['warn'],

      // Require expressions of type void to appear in statement position (https://typescript-eslint.io/rules/no-confusing-void-expression/)
      '@typescript-eslint/no-confusing-void-expression': ['off'],

      // Disallow duplicate enum member values (https://typescript-eslint.io/rules/no-duplicate-enum-values)
      '@typescript-eslint/no-duplicate-enum-values': ['warn'],

      // Disallow using the delete operator on computed key expressions (https://typescript-eslint.io/rules/no-dynamic-delete)
      '@typescript-eslint/no-dynamic-delete': ['warn'],

      // Disallow the declaration of empty interfaces (https://typescript-eslint.io/rules/no-empty-interface)
      '@typescript-eslint/no-empty-interface': ['off'],

      // Disallow the any type (https://typescript-eslint.io/rules/no-explicit-any)
      '@typescript-eslint/no-explicit-any': ['error'],

      // Disallow extra non-null assertions (https://typescript-eslint.io/rules/no-extra-non-null-assertion)
      '@typescript-eslint/no-extra-non-null-assertion': ['warn'],

      // Disallow non-null assertions in the left operand of a nullish coalescing operator (https://typescript-eslint.io/rules/no-non-null-asserted-nullish-coalescing)
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': [
        'warn'
      ],

      // Disallow non-null assertions after an optional chain expression (https://typescript-eslint.io/rules/no-non-null-asserted-optional-chain)
      '@typescript-eslint/no-non-null-asserted-optional-chain': [
        'warn'
      ],

      // Disallow aliasing this (https://typescript-eslint.io/rules/no-this-alias)
      '@typescript-eslint/no-this-alias': ['warn'],

      // Disallow unnecessary constraints on generic types (https://typescript-eslint.io/rules/no-unnecessary-type-constraint)
      '@typescript-eslint/no-unnecessary-type-constraint': ['warn'],

      // Disallow unused variables (https://typescript-eslint.io/rules/no-unused-vars)
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],

      // Enforce the use of as const over literal type (https://typescript-eslint.io/rules/prefer-as-const)
      '@typescript-eslint/prefer-as-const': ['warn'],

      // Require each enum member value to be explicitly initialized (https://typescript-eslint.io/rules/prefer-enum-initializers)
      '@typescript-eslint/prefer-enum-initializers': ['warn'],

      // Enforce the use of for-of loop over the standard for loop where possible (https://typescript-eslint.io/rules/prefer-for-of)
      '@typescript-eslint/prefer-for-of': ['warn'],

      // Enforce using function types instead of interfaces with call signatures (https://typescript-eslint.io/rules/prefer-function-type)
      '@typescript-eslint/prefer-function-type': ['warn'],

      // Enforce using concise optional chain expressions instead of chained logical ands, negated logical ors, or empty objects (https://typescript-eslint.io/rules/prefer-optional-chain)
      '@typescript-eslint/prefer-optional-chain': ['warn'],

      // Enforce using @ts-expect-error over @ts-ignore (https://typescript-eslint.io/rules/prefer-ts-expect-error)
      '@typescript-eslint/prefer-ts-expect-error': ['warn'],

      // Disallow duplicate class members (https://typescript-eslint.io/rules/no-dupe-class-members)
      '@typescript-eslint/no-dupe-class-members': ['warn'],

      // Require or disallow semicolons instead of ASI
      '@typescript-eslint/semi': ['warn'],

      // Require consistent spacing around type annotations.
      '@typescript-eslint/type-annotation-spacing': ['warn']
    }
  }
);
