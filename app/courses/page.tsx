import { BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CourseCard } from '@/components/CourseCard'
import { getDb } from '@/lib/server/db'
import { serializeCourse } from '@/lib/server/serialize'
import { parseTagsJson, uniqueTags } from '@/lib/server/tags'
import type { CourseRecord } from '@/lib/server/types'
import { ScanButton } from './scan-button'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CourseOverviewRow = CourseRecord & {
  sections_count: number
  lessons_count: number
  attachments_count: number
}

function getCourses() {
  return getDb()
    .prepare(
      `
        SELECT
          courses.*,
          (SELECT COUNT(*) FROM sections WHERE sections.course_id = courses.id) AS sections_count,
          (SELECT COUNT(*) FROM lessons WHERE lessons.course_id = courses.id AND lessons.unavailable = 0) AS lessons_count,
          (SELECT COUNT(*) FROM attachments WHERE attachments.course_id = courses.id AND attachments.unavailable = 0) AS attachments_count
        FROM courses
        ORDER BY course_name COLLATE NOCASE ASC
      `,
    )
    .all() as CourseOverviewRow[]
}

function getAllCourseTags(courses: CourseOverviewRow[]) {
  return uniqueTags(courses.flatMap((course) => parseTagsJson(course.tags_json)))
}

export default function CoursesPage() {
  const courses = getCourses()
  const availableTags = getAllCourseTags(courses)

  return (
    <main className="relative isolate flex-1 overflow-hidden bg-background">
      <div className="grid-pattern pointer-events-none absolute inset-0 z-0 opacity-20"></div>
      <section className="relative z-10 container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-2 font-black uppercase text-4xl font-semibold leading-none tracking-normal">
              Courses
            </h1>
          </div>
          <ScanButton />
          {/* <div className="flex w-fit items-center gap-2 border-3 border-foreground bg-secondary px-4 py-2 font-mono text-sm font-bold text-secondary-foreground shadow-[4px_4px_0px_hsl(var(--shadow-color))]">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </div> */}
        </div>

        {courses.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {courses.map((row) => {
              const course = serializeCourse(row)

              return <CourseCard course={course} key={course.id} />
            })}
          </div>
        ) : (
          <Card className="max-w-2xl bg-card">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-16 w-16 items-center justify-center border-3 border-foreground bg-warning text-warning-foreground shadow-[4px_4px_0px_hsl(var(--shadow-color))]">
                <BookOpen className="h-8 w-8" aria-hidden="true" />
              </div>
              <h2 className="font-sans text-3xl font-semibold tracking-normal">
                No scanned courses yet
              </h2>
              <p className="max-w-lg text-muted-foreground">
                Add course folders, then run a scan to fill the local library.
              </p>
              <code className="block border-3 border-foreground bg-muted p-3 font-mono text-sm font-bold">
                curl -X POST http://localhost:3000/api/scan
              </code>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}
