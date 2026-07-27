/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  // DB-dependent suites are excluded from the default `test` run.
  // Run them with `pnpm test:integration` when PostgreSQL is available.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/models/',
    '/tests/integration/',
    '/tests/property/',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/types/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
