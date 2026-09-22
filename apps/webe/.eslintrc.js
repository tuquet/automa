// https://eslint.org/docs/user-guide/configuring
// File taken from https://github.com/vuejs-templates/webpack/blob/1.3.1/template/.eslintrc.js, thanks.

module.exports = {
  root: true,
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
  },
  env: {
    browser: true,
    webextensions: true,
  },
  ignorePatterns: [
    'packages/**',
    'src/lib/google-*',
    'business/**',
    'webpack.*.js',
    'dist/**',
    'src/studio/standalone-browser-mock.js',
  ],
  // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
  // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
  extends: [
    'plugin:vue/vue3-recommended',
    'airbnb-base',
    'plugin:prettier/recommended',
  ],
  // required to lint *.vue files
  plugins: ['vue'],
  // check if imports actually resolve
  settings: {
    'import/resolver': {
      webpack: {
        config: './webpack.config.js',
      },
    },
    'import/ignore': ['@automa/types', 'node_modules'],
  },
  // add your custom rules here
  globals: {
    BROWSER_TYPE: true,
    __IS_RUNNER__: true,
  },
  rules: {
    camelcase: 'off',
    'no-await-in-loop': 'off',
    'no-alert': 'off',
    'import/no-import-module-exports': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-underscore-dangle': 'off',
    'func-names': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'import/no-named-default': 'off',
    'import/named': 'off',
    'no-restricted-syntax': 'off',
    'vue/multi-word-component-names': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'import/extensions': [
      'error',
      'always',
      {
        js: 'never',
      },
    ],
    // disallow reassignment of function parameters
    // disallow parameter object manipulation except for specific exclusions
    'no-param-reassign': 'off',
    'import/no-extraneous-dependencies': 'off',
    // disallow default export over named export
    'import/prefer-default-export': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'vue',
            importNames: [
              'defineProps',
              'defineEmits',
              'defineExpose',
              'withDefaults',
            ],
            message:
              'Compiler macros (defineProps, defineEmits, defineExpose, withDefaults) are compiler macros in <script setup> and do not need to be imported.',
          },
        ],
      },
    ],
  },
};
