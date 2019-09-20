module.exports = {
  preset: 'ts-jest',
  testEnvironment: '<rootDir>/test/@helpers/jest-env.js',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  testMatch: ['<rootDir>/test/**/*.ts'],
  testPathIgnorePatterns: ['<rootDir>/test/@.+/'],
  coveragePathIgnorePatterns: ['<rootDir>/test/@.+/'],
  moduleNameMapper: {
    '~/(.*)': '<rootDir>/src/$1',
  },
}
