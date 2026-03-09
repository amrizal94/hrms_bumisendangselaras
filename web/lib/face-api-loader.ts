let loaded = false
let loading = false
let loadPromise: Promise<void> | null = null

export async function loadFaceApiModels(): Promise<void> {
  if (loaded) return
  if (loading && loadPromise) return loadPromise

  loading = true
  loadPromise = (async () => {
    const faceapi = await import('face-api.js')
    const MODEL_URL = '/models'
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
    loaded = true
    loading = false
  })()

  return loadPromise
}

export async function getFaceApi() {
  await loadFaceApiModels()
  const faceapi = await import('face-api.js')
  return faceapi
}
