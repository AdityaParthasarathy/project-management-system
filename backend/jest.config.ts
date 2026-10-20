import type { Config } from 'jest';

// Nest 12 packages are ESM-only, so Jest runs in ESM mode (see "test" script).
const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\.spec\.ts$',
  transform: {
    '^.+\.ts$': [
      'ts-jest',
      {
        useESM: true,
        diagnostics: false,
        tsconfig: {
          module: 'esnext',
          moduleResolution: 'bundler',
          target: 'es2022',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
        },
      },
    ],
  },
  testEnvironment: 'node',
};

export default config;
