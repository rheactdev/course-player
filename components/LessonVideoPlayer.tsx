'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { SerializedProgress } from '@/lib/server/serialize'

type LessonVideoPlayerProps = {
  lessonId: number
  src: string
  captionsSrc?: string
  initialProgress: SerializedProgress | null
}

type ProgressPayload = {
  positionSeconds: number
  durationSeconds: number | null
  eventType: string
}

const SYNC_INTERVAL_MS = 5_000
const RESUME_END_BUFFER_SECONDS = 10

export function LessonVideoPlayer({
  lessonId,
  src,
  captionsSrc,
  initialProgress,
}: LessonVideoPlayerProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const restoredRef = useRef(false)
  const lastSyncMsRef = useRef(0)
  const lastSyncedPositionRef = useRef<number | null>(null)
  const syncProgressRef = useRef<(eventType: string, urgent?: boolean) => void>(() => {})
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  function buildPayload(eventType: string): ProgressPayload | null {
    const video = videoRef.current
    if (!video) return null

    const durationSeconds = Number.isFinite(video.duration) ? video.duration : null
    const payload: ProgressPayload = {
      positionSeconds: Number.isFinite(video.currentTime) ? video.currentTime : 0,
      durationSeconds,
      eventType,
    }

    return payload
  }

  function syncProgress(eventType: string, urgent = false) {
    const payload = buildPayload(eventType)
    if (!payload) return

    const lastSyncedPosition = lastSyncedPositionRef.current
    const positionDelta = lastSyncedPosition === null
      ? Number.POSITIVE_INFINITY
      : Math.abs(payload.positionSeconds - lastSyncedPosition)
    const shouldSkip =
      !urgent &&
      eventType === 'timeupdate' &&
      positionDelta < 1 &&
      Date.now() - lastSyncMsRef.current < SYNC_INTERVAL_MS

    if (shouldSkip) return

    const url = `/api/lessons/${lessonId}/progress`
    const body = JSON.stringify(payload)
    lastSyncMsRef.current = Date.now()
    lastSyncedPositionRef.current = payload.positionSeconds

    if (urgent && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      if (sent) return
    }

    setSyncState('saving')
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: urgent,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Progress sync failed: ${response.status}`)
        return response.json() as Promise<{ progress?: { completed?: boolean } }>
      })
      .then((body) => {
        setSyncState('saved')
        if (body.progress?.completed) router.refresh()
      })
      .catch(() => setSyncState('error'))
  }

  useEffect(() => {
    syncProgressRef.current = syncProgress
  })

  function handleLoadedMetadata() {
    const video = videoRef.current
    if (!video || restoredRef.current) return

    const resumePosition = initialProgress?.completed ? 0 : initialProgress?.positionSeconds ?? 0
    const duration = Number.isFinite(video.duration) ? video.duration : null
    const shouldResume =
      resumePosition > 3 &&
      (!duration || resumePosition < Math.max(0, duration - RESUME_END_BUFFER_SECONDS))

    if (shouldResume) {
      video.currentTime = resumePosition
    }

    restoredRef.current = true
    lastSyncedPositionRef.current = null
  }

  function handleTimeUpdate() {
    if (Date.now() - lastSyncMsRef.current >= SYNC_INTERVAL_MS) {
      syncProgress('timeupdate')
    }
  }

  useEffect(() => {
    function flushOnHidden() {
      if (document.visibilityState === 'hidden') {
        syncProgressRef.current('visibilitychange', true)
      }
    }

    function flushOnPageExit() {
      syncProgressRef.current('pagehide', true)
    }

    document.addEventListener('visibilitychange', flushOnHidden)
    window.addEventListener('pagehide', flushOnPageExit)

    return () => {
      document.removeEventListener('visibilitychange', flushOnHidden)
      window.removeEventListener('pagehide', flushOnPageExit)
      syncProgressRef.current('unmount', true)
    }
  }, [lessonId])

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        className="h-full w-full bg-black"
        controls
        onEnded={() => syncProgress('ended')}
        onLoadedMetadata={handleLoadedMetadata}
        onPause={() => syncProgress('pause', true)}
        onPlay={() => syncProgress('play')}
        onSeeked={() => syncProgress('seeked', true)}
        onTimeUpdate={handleTimeUpdate}
        preload="metadata"
        src={src}
      >
        {captionsSrc ? (
          <track default kind="subtitles" label="English" src={captionsSrc} srcLang="en" />
        ) : null}
      </video>
      {syncState === 'error' ? (
        <div className="absolute bottom-3 right-3 border-2 border-foreground bg-background px-2 py-1 font-mono text-[10px] font-bold uppercase text-destructive shadow-[3px_3px_0px_hsl(var(--shadow-color))]">
          Progress not synced
        </div>
      ) : null}
    </div>
  )
}
