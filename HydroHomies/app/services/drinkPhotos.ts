/**
 * Before/after photo "proof" that friends can see.
 *
 * Photos are stored as small JPEG thumbnails inside Firestore (drinkPhotos/{entryId})
 * because Cloud Storage needs the Blaze plan. Each pair is roughly 30-60 KB.
 */
import * as ImageManipulator from "expo-image-manipulator"

import { load, save } from "@/utils/storage"

const SHARE_KEY = "drinkPhotos.share"
const THUMB_WIDTH = 360

/** Whether new drinks share their photos with friends by default */
export function loadPhotoSharing(): boolean {
  return load<boolean>(SHARE_KEY) ?? true
}

export function savePhotoSharing(share: boolean) {
  save(SHARE_KEY, share)
}

/** Shrinks a photo to a small JPEG data URI */
export async function makeThumbnail(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: THUMB_WIDTH } }], {
    compress: 0.5,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  })
  if (!result.base64) throw new Error("Could not encode photo")
  const base64 = result.base64.replace(/^data:image\/\w+;base64,/, "")
  return `data:image/jpeg;base64,${base64}`
}
