import Image from "next/image";
import Link from "next/link";
import { BookOpen, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/lib/server/db";
import { serializeCourse } from "@/lib/server/serialize";
import type { CourseRecord } from "@/lib/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CourseOverviewRow = CourseRecord & {
  sections_count: number;
  lessons_count: number;
  attachments_count: number;
};

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
    .all() as CourseOverviewRow[];
}

function truncateTitle(title: string) {
  return title.length > 72 ? `${title.slice(0, 69).trim()}...` : title;
}

export default function Home() {
  const courses = getCourses();

  return (
    <>
      <SiteHeader activeHref="/" />
      <main className="flex-1 bg-background">
        <section className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 border-b-3 border-foreground pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Local Library
              </p>
              <h1 className="mt-2 font-sans text-4xl font-semibold leading-none tracking-normal">
                Courses
              </h1>
            </div>
            <div className="flex w-fit items-center gap-2 border-3 border-foreground bg-secondary px-4 py-2 font-mono text-sm font-bold text-secondary-foreground shadow-[4px_4px_0px_hsl(var(--shadow-color))]">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {courses.length} {courses.length === 1 ? "course" : "courses"}
            </div>
          </div>

          {courses.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((row) => {
                const course = serializeCourse(row);
                const visibleTags = course.tags.slice(0, 3);
                const fallbackTags = visibleTags.length ? visibleTags : ["Course"];

                return (
                  <Link
                    aria-label={`Open ${course.courseName}`}
                    className="block"
                    href={`/courses/${course.slug}`}
                    key={course.id}
                  >
                    <Card className="min-h-[26rem] bg-card" interactive>
                      <CardContent className="flex h-full flex-col p-4">
                      <div className="relative mb-4 flex aspect-[4/3] items-center justify-center border-3 border-foreground bg-muted">
                        {course.coverPath ? (
                          <Image
                            alt=""
                            className="object-cover"
                            fill
                            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw"
                            src={`/media/covers/${course.id}`}
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center border-3 border-foreground bg-accent text-accent-foreground shadow-[3px_3px_0px_hsl(var(--shadow-color))]">
                            <ImageIcon className="h-8 w-8" aria-hidden="true" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h2 className="font-sans text-2xl font-semibold leading-tight tracking-normal">
                          {truncateTitle(course.courseName)}
                        </h2>
                        <p className="text-base font-medium text-muted-foreground">
                          {course.creator || "Unknown creator"}
                        </p>
                      </div>

                      <dl className="mt-4 grid grid-cols-3 border-3 border-foreground font-mono text-[0.7rem] font-bold uppercase">
                        <div className="border-r-3 border-foreground bg-primary p-2 text-primary-foreground">
                          <dt>Sections</dt>
                          <dd className="text-base">{row.sections_count}</dd>
                        </div>
                        <div className="border-r-3 border-foreground bg-secondary p-2 text-secondary-foreground">
                          <dt>Lessons</dt>
                          <dd className="text-base">{row.lessons_count}</dd>
                        </div>
                        <div className="bg-accent p-2 text-accent-foreground">
                          <dt>Files</dt>
                          <dd className="text-base">{row.attachments_count}</dd>
                        </div>
                      </dl>

                      <div className="mt-auto flex flex-wrap gap-2 pt-6">
                        {fallbackTags.map((tag, index) => (
                          <Badge
                            key={`${course.id}-${tag}`}
                            variant={index === 0 ? "default" : index === 1 ? "secondary" : "accent"}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
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
    </>
  );
}
