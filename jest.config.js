/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server'], // Point Jest to the server directory for tests
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1', // If you use path aliases like @shared
    // Add other aliases if needed
  },
  setupFilesAfterEnv: ['./server/jest.setup.ts'], // Optional: for global setup after environment
};
