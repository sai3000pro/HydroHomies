/**
 * iOS/Android: TF.js React Native platform adapter. Importing the package
 * registers the platform; bundleResourceIO loads bundled models and
 * decodeJpeg turns JPEG bytes into tensors.
 */
import "@tensorflow/tfjs-react-native"

export { bundleResourceIO, decodeJpeg } from "@tensorflow/tfjs-react-native"
