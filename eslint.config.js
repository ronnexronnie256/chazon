import next from 'eslint-config-next';

export default [
  ...next,
  {
    rules: {
      'no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'prefer-const': 'warn',
      'no-console': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  },
];
