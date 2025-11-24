module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.integration.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.test.ts',
        '!src/server.ts',
        '!src/app.ts',
        '!src/**/__tests__/**',
    ],
    coverageDirectory: 'coverage/integration',
    coverageReporters: ['text', 'lcov', 'html'],
};
