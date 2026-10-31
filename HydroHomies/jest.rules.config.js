/**
 * Firestore security rules tests. They need the Firestore emulator, so they run
 * separately from `npm test`: use `npm run test:rules` (starts the emulator for you).
 * @type {import('@jest/types').Config.ProjectConfig}
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/rules/**/*.test.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/app/$1" },
  testTimeout: 30000,
}
