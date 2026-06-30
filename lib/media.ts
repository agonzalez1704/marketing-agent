// Client + server safe media helpers.

export const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "m4v", "ogv"]

/** True if the URL points at a video (by extension, ignoring query string). */
export function isVideoUrl(url: string): boolean {
  const path = url.split("?")[0].toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith("." + ext))
}
