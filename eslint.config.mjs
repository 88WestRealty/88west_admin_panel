import next from 'eslint-config-next';

/** eslint-config-next v16 ships a native flat config array. */
export default [
  ...next,
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
];
