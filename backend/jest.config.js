module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest', {
      jsc: { parser: { syntax: 'typescript', decorators: true }, transform: { decoratorMetadata: true } },
    }],
  },
  collectCoverageFrom: ['src/modules/**/*.service.ts', 'src/modules/**/strategies/*.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
