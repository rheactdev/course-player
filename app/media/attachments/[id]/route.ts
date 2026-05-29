import { getDb } from '@/lib/server/db'
import { downloadCourseFile } from '@/lib/server/media'
import type { AttachmentRecord } from '@/lib/server/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const attachmentId = Number(id)
  if (!Number.isSafeInteger(attachmentId) || attachmentId < 1) {
    return new Response('Invalid attachment id', { status: 400 })
  }

  const attachment = getDb().prepare('SELECT * FROM attachments WHERE id = ?').get(attachmentId) as
    | AttachmentRecord
    | undefined

  if (!attachment || attachment.unavailable) {
    return new Response('Not found', { status: 404 })
  }

  const result = downloadCourseFile(attachment.relative_path, attachment.name)
  if (!result) return new Response('Not found', { status: 404 })

  return new Response(result.body, { headers: result.headers })
}
