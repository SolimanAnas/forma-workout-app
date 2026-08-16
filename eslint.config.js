import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Invariant: the domain layer is pure — it must not import from
    // sensors / ui / services / data (spec §6, ARCHITECTURE §3).
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '**/sensors/*',
            '**/sensors/**',
            '**/ui/*',
            '**/ui/**',
            '**/services/*',
            '**/services/**',
            '**/data/*',
            '**/data/**',
          ],
        },
      ],
    },
  },
);
