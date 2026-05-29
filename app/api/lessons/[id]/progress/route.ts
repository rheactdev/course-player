import { saveLessonProgress } from '@/lib/server/progress'
import { serializeProgress } from '@/lib/server/serialize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lessonId = Number(id)
  if (!Number.isSafeInteger(lessonId) || lessonId < 1) {
    return Response.json({ error: 'Invalid lesson id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const progress = saveLessonProgress(lessonId, body)
  if (!progress) {
    return Response.json({ error: 'Lesson not found' }, { status: 404 })
  }

  return Response.json({ progress: serializeProgress(progress) })
}
