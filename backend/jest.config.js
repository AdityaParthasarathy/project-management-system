// Nest 12 and the app run as native ES modules, so Jest runs in ESM mode (see "test" script).
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\.spec\.ts$',
  moduleNameMapper: { '^(\.{1,2}/.*)\.js$': '$1' },
  transform: {
    '^.+\.ts$': [
      'ts-jest',
      { useESM: true, diagnostics: false },
    ],
  },
  testEnvironment: 'node',
};
