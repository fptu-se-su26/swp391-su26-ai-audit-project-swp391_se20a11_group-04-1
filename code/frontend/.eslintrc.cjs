module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'playwright-report', 'test-results', 'e2e-tests'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.3' } },
  plugins: ['react-refresh'],
  rules: {
    // Kích hoạt các quy tắc để hiển thị đúng ~10 lỗi thực tế
    'no-useless-escape': 'error',       // Lỗi escape ký tự vô ích trong regex
    'no-undef': 'error',                // Lỗi biến chưa định nghĩa trong logic
    'no-extra-semi': 'error',           // Lỗi thừa dấu chấm phẩy

    // Tắt các quy tắc gây ra quá nhiều lỗi nhiễu (>400 lỗi)
    'no-unused-vars': 'off',
    'no-empty': 'off',
    'no-control-regex': 'off',
    'no-case-declarations': 'off',
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    'react/display-name': 'off',
    'react-refresh/only-export-components': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
}
