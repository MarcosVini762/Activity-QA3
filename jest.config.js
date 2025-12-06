module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'Spotify-API-Tests/src/**/*.js',
    '!Spotify-API-Tests/src/utils/logReportGenerator.js',
    'Spotify-API-Tests/src/tests/**/*.test.js',
    '!Spotify-API-Tests/src/utils/metricsCollector.js',
    'Spotify-API-Tests/src/tests/**/*.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  collectCoverage: false,
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  reporters: [
    'default',
    ['jest-html-reporters', {
      pageTitle: 'Relatório de Testes',
      outputPath: './test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
      includeSuiteFailure: true,
      publicPath: './coverage',
      expand: true
    }]
  ]
};