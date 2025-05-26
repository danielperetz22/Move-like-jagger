module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
      '<rootDir>/src/**/*.test.ts',   
    ],
    transform: { '^.+\\.ts$': 'ts-jest' },
    testTimeout: 30000,
};