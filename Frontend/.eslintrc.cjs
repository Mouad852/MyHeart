module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react'],
  settings: { react: { version: '18.3' } },
  rules: {
    'react/react-in-jsx-scope': 'off',   // Not needed with new JSX transform
    'react/prop-types': 'off',           // Not using TypeScript prop-types
    'no-unused-vars': 'warn',
  },
}
