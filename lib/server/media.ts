import { createReadStream } from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import mime from 'mime'
import { getExistingCourseFile } from './paths'

export type StreamResult =
  | { status: 200 | 206; body: ReadableStream<Uint8Array>; headers: Headers }
  | { status: 404 | 416; body: string; headers?: Headers }

function contentTypeFor(filePath: string) {
  return mime.getType(filePath) || 'application/octet-stream'
}

function encodeAttachmentName(name: string) {
  return encodeURIComponent(name).replace(/['()]/g, escape).replaceAll('*', '%2A')
}

export function streamCourseFile(relativePath: string, rangeHeader: string | null): StreamResult {
  const file = getExistingCourseFile(relativePath)
  if (!file) return { status: 404, body: 'Not found' }

  const fileSize = file.stats.size
  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Content-Type': contentTypeFor(file.absolutePath),
  })

  if (!rangeHeader) {
    headers.set('Content-Length', String(fileSize))
    return {
      status: 200,
      body: Readable.toWeb(createReadStream(file.absolutePath)) as ReadableStream<Uint8Array>,
      headers,
    }
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader)
  if (!match) {
    headers.set('Content-Range', `bytes */${fileSize}`)
    return { status: 416, body: 'Invalid range', headers }
  }

  const [, startText, endText] = match
  let start = startText ? Number(startText) : 0
  let end = endText ? Number(endText) : fileSize - 1

  if (!startText && endText) {
    const suffixLength = Number(endText)
    start = Math.max(fileSize - suffixLength, 0)
    end = fileSize - 1
  }

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    start >= fileSize
  ) {
    headers.set('Content-Range', `bytes */${fileSize}`)
    return { status: 416, body: 'Invalid range', headers }
  }

  end = Math.min(end, fileSize - 1)
  headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`)
  headers.set('Content-Length', String(end - start + 1))

  return {
    status: 206,
    body: Readable.toWeb(createReadStream(file.absolutePath, { start, end })) as ReadableStream<Uint8Array>,
    headers,
  }
}

export function downloadCourseFile(relativePath: string, filename?: string) {
  const file = getExistingCourseFile(relativePath)
  if (!file) return null

  const downloadName = filename || path.basename(file.absolutePath)
  const headers = new Headers({
    'Content-Disposition': `attachment; filename="${downloadName.replaceAll('"', '')}"; filename*=UTF-8''${encodeAttachmentName(downloadName)}`,
    'Content-Length': String(file.stats.size),
    'Content-Type': contentTypeFor(file.absolutePath),
  })

  return {
    body: Readable.toWeb(createReadStream(file.absolutePath)) as ReadableStream<Uint8Array>,
    headers,
  }
}

export function serveCourseFile(relativePath: string) {
  const file = getExistingCourseFile(relativePath)
  if (!file) return null

  return {
    body: Readable.toWeb(createReadStream(file.absolutePath)) as ReadableStream<Uint8Array>,
    headers: new Headers({
      'Content-Length': String(file.stats.size),
      'Content-Type': contentTypeFor(file.absolutePath),
    }),
  }
}
