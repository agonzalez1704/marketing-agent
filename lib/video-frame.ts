/** Extract a representative still frame from a video File, client-side (no ffmpeg). */
export async function extractVideoFrame(file: File): Promise<File> {
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement("video")
    video.src = url
    video.muted = true
    video.playsInline = true
    video.preload = "auto"

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve()
      video.onerror = () => reject(new Error("Couldn't read that video"))
    })

    const target = Math.min(1, (Number.isFinite(video.duration) ? video.duration : 2) / 2)
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve()
      video.currentTime = target
    })

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9))
    if (!blob) throw new Error("Couldn't capture a frame")

    const base = file.name.replace(/\.[^.]+$/, "")
    return new File([blob], `${base}-frame.jpg`, { type: "image/jpeg" })
  } finally {
    URL.revokeObjectURL(url)
  }
}
