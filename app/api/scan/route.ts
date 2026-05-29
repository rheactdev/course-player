import { scanCourseLibrary } from '@/lib/server/scanner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function POST() {
  const summary = scanCourseLibrary()
  return Response.json(summary, { status: summary.status === 'success' ? 200 : 500 })
}
