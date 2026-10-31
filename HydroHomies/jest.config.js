/** @type {import('@jest/types').Config.ProjectConfig} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/setup.ts"],
  // Needs the Firestore emulator; run with `npm run test:rules`
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/test/rules/"],
}
