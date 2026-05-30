import { getDb } from './db'
import type { ProgressRecord, WatchedInterval } from './types'

export type ProgressInput = {
  positionSeconds?: unknown
  durationSeconds?: unknown
  watchedIntervalStart?: unknown
  watchedIntervalEnd?: unknown
  eventType?: unknown
}

function toOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null
}

function clampToDuration(value: number, durationSeconds: number | null) {
  return durationSeconds && durationSeconds > 0 ? Math.min(value, durationSeconds) : value
}

export function mergeWatchedIntervals(intervals: WatchedInterval[]) {
  const sorted = intervals
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .sort((a, b) => a[0] - b[0])

  const merged: WatchedInterval[] = []
  for (const [start, end] of sorted) {
    const last = merged.at(-1)
    if (!last || start > last[1]) {
      merged.push([start, end])
    } else {
      last[1] = Math.max(last[1], end)
    }
  }

  return merged
}

export function saveLessonProgress(lessonId: number, input: ProgressInput) {
  const db = getDb()
  const lesson = db.prepare('SELECT id FROM lessons WHERE id = ? AND unavailable = 0').get(lessonId)
  if (!lesson) return null

  const existing = db.prepare('SELECT * FROM progress WHERE lesson_id = ?').get(lessonId) as
    | ProgressRecord
    | undefined

  const durationSeconds =
    toOptionalNumber(input.durationSeconds) ?? existing?.duration_seconds ?? null
  const positionSeconds = clampToDuration(
    toOptionalNumber(input.positionSeconds) ?? existing?.position_seconds ?? 0,
    durationSeconds,
  )
  const isEndedEvent = input.eventType === 'ended'
  const percentWatched =
    durationSeconds && durationSeconds > 0
      ? Math.min(100, (positionSeconds / durationSeconds) * 100)
      : 0
  const completed = isEndedEvent || percentWatched >= 90 ? 1 : 0
  const completedAt = completed ? existing?.completed_at || new Date().toISOString() : null
  const watchedSeconds = completed && durationSeconds ? durationSeconds : positionSeconds
  const watchedIntervals: WatchedInterval[] =
    durationSeconds && positionSeconds > 0 ? [[0, watchedSeconds]] : []

  db.prepare(
    `
    INSERT INTO progress (
      lesson_id,
      position_seconds,
      duration_seconds,
      watched_intervals_json,
      watched_seconds,
      percent_watched,
      completed,
      completed_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(lesson_id) DO UPDATE SET
      position_seconds = excluded.position_seconds,
      duration_seconds = excluded.duration_seconds,
      watched_intervals_json = excluded.watched_intervals_json,
      watched_seconds = excluded.watched_seconds,
      percent_watched = excluded.percent_watched,
      completed = excluded.completed,
      completed_at = excluded.completed_at,
      updated_at = CURRENT_TIMESTAMP
  `,
  ).run(
    lessonId,
    positionSeconds,
    durationSeconds,
    JSON.stringify(watchedIntervals),
    watchedSeconds,
    percentWatched,
    completed,
    completedAt,
  )

  return db.prepare('SELECT * FROM progress WHERE lesson_id = ?').get(lessonId) as ProgressRecord
}
