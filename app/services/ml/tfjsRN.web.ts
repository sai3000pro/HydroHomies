/**
 * TensorFlow.js React Native imports - Web platform
 * This file is loaded on web where @tensorflow/tfjs-react-native is not needed
 * The web version uses regular TensorFlow.js which works directly in the browser
 */

// bundleResourceIO and decodeJpeg are not available on web - return null
export const bundleResourceIO = null
export const decodeJpeg = null