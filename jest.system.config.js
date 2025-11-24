module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.system.test.ts'],
    testTimeout: 60000, // Increased timeout for visible browser tests
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.test.ts',
        '!src/server.ts',
        '!src/app.ts',
        '!src/**/__tests__/**',
    ],
    coverageDirectory: 'coverage/system',
    coverageReporters: ['text', 'lcov', 'html'],
};
