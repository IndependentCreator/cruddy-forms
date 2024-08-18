import type { Options } from 'tsup';

const env = process.env.NODE_ENV;

export const tsup: Options = {
  bundle: env === 'production',
  clean: true,
  dts: true,
  entry: ['src/**/*.ts'],
  entryPoints: ['src/index.ts'],
  format: ['esm'], // Only output ES modules
  minify: env === 'production',
  outDir: env === 'production' ? 'dist' : 'lib',
  skipNodeModulesBundle: true,
  splitting: false,
  target: 'es2022',
  watch: env === 'development'
};
