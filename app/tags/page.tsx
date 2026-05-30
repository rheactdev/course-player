import { Tags } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CourseTagSelector } from '@/components/CourseTagSelector'
import { getDb } from '@/lib/server/db'
import { serializeCourse } from '@/lib/server/serialize'
import { parseTagsJson, uniqueTags } from '@/lib/server/tags'
import type { CourseRecord } from '@/lib/server/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getCourses() {
  return getDb()
    .prepare(
      `
        SELECT *
        FROM courses
        ORDER BY course_name COLLATE NOCASE ASC
      `,
    )
    .all() as CourseRecord[]
}

function getAllCourseTags(courses: CourseRecord[]) {
  return uniqueTags(courses.flatMap((course) => parseTagsJson(course.tags_json)))
}

export default function TagsPage() {
  const rows = getCourses()
  const availableTags = getAllCourseTags(rows)
  const courses = rows.map(serializeCourse)

  return (
    <main className="relative isolate flex-1 overflow-hidden bg-background">
      <div className="grid-pattern pointer-events-none absolute inset-0 z-0 opacity-20"></div>
      <section className="relative z-10 container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-2 font-black uppercase text-4xl font-semibold leading-none tracking-normal">
              Manage Tags
            </h1>
          </div>
        </div>

        {courses.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {courses.map((course) => (
              <Card key={course.id} className="bg-card">
                <CardContent className="p-5">
                  <h2 className="mb-2 font-heading text-xl font-bold tracking-tight">
                    {course.courseName}
                  </h2>
                  <CourseTagSelector
                    availableTags={availableTags}
                    courseSlug={course.slug}
                    initialTags={course.tags}
                    variant="plain"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl bg-card">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-16 w-16 items-center justify-center border-3 border-foreground bg-warning text-warning-foreground shadow-[4px_4px_0px_hsl(var(--shadow-color))]">
                <Tags className="h-8 w-8" aria-hidden="true" />
              </div>
              <h2 className="font-sans text-3xl font-semibold tracking-normal">
                No courses available
              </h2>
              <p className="max-w-lg text-muted-foreground">
                You need to scan courses before you can manage their tags.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}
