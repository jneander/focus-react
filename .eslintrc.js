module.exports = {
  env: {
    browser: true,
    es6: true,
    mocha: true,
    node: false,
  },

  extends: [
    'eslint:recommended',
    'prettier',
    'plugin:eslint-comments/recommended',
    'plugin:promise/recommended',
    'prettier/react',
    'plugin:react/recommended',
  ],

  globals: {},

  overrides: [
    {
      env: {
        node: true,
      },

      files: ['./config/**/*.js', './scripts/**/*.js', './babel.config.js', './.eslintrc.js'],
    },

    {
      files: ['./**/*.spec.js', './**/_specs_/**/*.js'],

      globals: {
        expect: 'writable',
      },

      rules: {
        'react/prop-types': 'off',
      },
    },
  ],

  parser: '@babel/eslint-parser',

  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },

    ecmaVersion: 2018,
    sourceType: 'module',
  },

  plugins: ['import', 'prettier', 'promise', 'mocha', 'jsx-a11y', 'react', 'react-hooks'],
  root: true,

  rules: {
    'arrow-body-style': 'off',
    'eslint-comments/no-unused-disable': 'error',
    'import/extensions': ['error', 'ignorePackages', {js: 'never'}],
    'import/no-extraneous-dependencies': ['error', {devDependencies: true}],
    'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
    'prefer-arrow-callback': 'off',
    'prettier/prettier': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react/jsx-filename-extension': ['error', {extensions: ['.js']}],
    'react/prop-types': 'off',
  },

  settings: {
    react: {
      version: 'detect',
    },
  },
}
