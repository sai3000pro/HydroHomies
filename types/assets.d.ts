/**
 * Type declarations for asset files used in the app
 * This allows TypeScript to recognize asset file imports
 */

declare module "*.bin" {
  const value: number // Resource ID for React Native bundleResourceIO
  export default value
}

declare module "*.json" {
  const value: any
  export default value
}
