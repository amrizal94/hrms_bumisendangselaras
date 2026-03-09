'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getFaceApi } from '@/lib/face-api-loader'
import { Loader2, Camera, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FaceDetection {
  descriptor: number[]
  box: { x: number; y: number; width: number; height: number }
}

interface FaceCameraProps {
  onCapture: (detection: FaceDetection, snapshot: string) => void
  captureLabel?: string
  disabled?: boolean
}

export function FaceCamera({ onCapture, captureLabel = 'Capture', disabled = false }: FaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)

  const [status, setStatus] = useState<'loading' | 'ready' | 'no-face' | 'face-found' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Detection loop
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !overlayRef.current) return
    const faceapi = await getFaceApi()
    const video = videoRef.current
    const overlay = overlayRef.current
    const ctx = overlay.getContext('2d')
    if (!ctx) return

    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect)
        return
      }

      const result = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor()

      // Sync overlay size
      overlay.width = video.videoWidth || video.clientWidth
      overlay.height = video.videoHeight || video.clientHeight
      ctx.clearRect(0, 0, overlay.width, overlay.height)

      if (result) {
        setStatus('face-found')
        // Draw bounding box
        const { x, y, width, height } = result.detection.box
        const scaleX = overlay.width / (video.videoWidth || overlay.width)
        const scaleY = overlay.height / (video.videoHeight || overlay.height)
        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth = 3
        ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY)
        // Small dot corners
        const corners = [
          [x * scaleX, y * scaleY],
          [(x + width) * scaleX, y * scaleY],
          [x * scaleX, (y + height) * scaleY],
          [(x + width) * scaleX, (y + height) * scaleY],
        ]
        ctx.fillStyle = '#22c55e'
        corners.forEach(([cx, cy]) => {
          ctx.beginPath()
          ctx.arc(cx, cy, 5, 0, Math.PI * 2)
          ctx.fill()
        })
      } else {
        setStatus('no-face')
      }

      animFrameRef.current = requestAnimationFrame(detect)
    }

    detect()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await getFaceApi() // preload models
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('no-face')
        runDetection()
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Camera error'
          setErrorMsg(msg.includes('Permission') ? 'Camera permission denied.' : msg)
          setStatus('error')
        }
      }
    }

    init()
    return () => {
      cancelled = true
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [runDetection])

  async function handleCapture() {
    if (!videoRef.current || !canvasRef.current || status !== 'face-found') return

    const faceapi = await getFaceApi()
    const result = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
      .withFaceLandmarks(true)
      .withFaceDescriptor()

    if (!result) {
      setStatus('no-face')
      return
    }

    // Snapshot
    const canvas = canvasRef.current
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    const snapshot = canvas.toDataURL('image/jpeg', 0.8)

    onCapture(
      { descriptor: Array.from(result.descriptor), box: result.detection.box },
      snapshot
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-xl overflow-hidden border-2 border-muted bg-black w-[320px] h-[240px]">
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Loading models...</span>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-400 p-4 text-center">
            <AlertCircle className="w-8 h-8" />
            <span className="text-sm">{errorMsg || 'Camera error'}</span>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Status badge */}
        {(status === 'face-found' || status === 'no-face') && (
          <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
            status === 'face-found' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
          }`}>
            {status === 'face-found' ? 'Face detected' : 'No face detected'}
          </div>
        )}
      </div>

      <Button
        onClick={handleCapture}
        disabled={disabled || status !== 'face-found'}
        className="w-[320px]"
      >
        <Camera className="w-4 h-4 mr-2" />
        {captureLabel}
      </Button>
    </div>
  )
}
