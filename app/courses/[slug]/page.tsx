import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FileDown, ImageIcon } from "lucide-react";
import { getDb } from "@/lib/server/db";
import { findMatchingVttPath } from "@/lib/server/media";
import { serializeCourse, serializeProgress } from "@/lib/server/serialize";
import type { AttachmentRecord, CourseRecord, LessonRecord, ProgressRecord, SectionRecord } from "@/lib/server/types";
import CourseSidebar from "@/components/CourseSidebar";
import { LessonVideoPlayer } from "@/components/LessonVideoPlayer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
};

function getCourse(slug: string) {
  return getDb().prepare("SELECT * FROM courses WHERE slug = ?").get(slug) as
    | CourseRecord
    | undefined;
}

function getSections(courseId: number) {
  return getDb()
    .prepare(
      `
        SELECT * FROM sections
        WHERE course_id = ?
        ORDER BY sort_order ASC, title COLLATE NOCASE ASC
      `,
    )
    .all(courseId) as SectionRecord[];
}

function getLessons(courseId: number) {
  return getDb()
    .prepare(
      `
        SELECT lessons.* FROM lessons
        INNER JOIN sections ON sections.id = lessons.section_id
        WHERE lessons.course_id = ?
        ORDER BY sections.sort_order ASC, lessons.sort_order ASC, lessons.title COLLATE NOCASE ASC
      `,
    )
    .all(courseId) as LessonRecord[];
}

function getAttachments(courseId: number) {
  return getDb()
    .prepare(
      `
        SELECT * FROM attachments
        WHERE course_id = ?
        ORDER BY attachment_index ASC, name COLLATE NOCASE ASC
      `,
    )
    .all(courseId) as AttachmentRecord[];
}

function getProgress(lessonId: number) {
  return getDb()
    .prepare("SELECT * FROM progress WHERE lesson_id = ?")
    .get(lessonId) as ProgressRecord | undefined;
}

function getCompletedLessonIds(courseId: number) {
  const rows = getDb()
    .prepare(
      `
        SELECT progress.lesson_id AS lessonId
        FROM progress
        INNER JOIN lessons ON lessons.id = progress.lesson_id
        WHERE lessons.course_id = ? AND progress.completed = 1
      `,
    )
    .all(courseId) as { lessonId: number }[];

  return rows.map((row) => row.lessonId);
}

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
  const [{ slug }, { lesson: lessonParam }] = await Promise.all([params, searchParams]);
  const courseRecord = getCourse(slug);

  if (!courseRecord) notFound();

  const course = serializeCourse(courseRecord);
  const sections = getSections(course.id);
  const lessons = getLessons(course.id);
  const attachments = getAttachments(course.id);
  const requestedLessonId = Number(lessonParam);
  const selectedLesson =
    lessons.find((lesson) => lesson.id === requestedLessonId && !lesson.unavailable) ||
    lessons.find((lesson) => !lesson.unavailable) ||
    lessons[0];
  const selectedSection = selectedLesson
    ? sections.find((section) => section.id === selectedLesson.section_id)
    : undefined;
  const selectedAttachments = selectedLesson
    ? attachments.filter((attachment) => attachment.lesson_id === selectedLesson.id)
    : [];
  const hasSelectedLessonCaptions = selectedLesson
    ? Boolean(findMatchingVttPath(selectedLesson.relative_path))
    : false;
  const selectedProgress = selectedLesson ? serializeProgress(getProgress(selectedLesson.id)) : null;
  const completedLessonIds = getCompletedLessonIds(course.id);

  return (
    <main className="flex-1">
      <div className="grid-pattern pointer-events-none absolute inset-0 z-0 opacity-20"></div>
      <CourseSidebar course={course} courseName={course.courseName} sections={sections} lessons={lessons} selectedLesson={selectedLesson} completedLessonIds={completedLessonIds}><section className="container mx-auto">
        <section className="min-w-0">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden">
            {selectedLesson && !selectedLesson.unavailable ? (
              <LessonVideoPlayer
                captionsSrc={hasSelectedLessonCaptions ? `/media/lessons/${selectedLesson.id}/captions` : undefined}
                initialProgress={selectedProgress}
                key={selectedLesson.id}
                lessonId={selectedLesson.id}
                src={`/media/lessons/${selectedLesson.id}`}
              />
            ) : course.coverPath ? (
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="(min-width: 1280px) 60vw, 90vw"
                src={`/media/covers/${course.id}`}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center border-3 border-foreground bg-accent text-accent-foreground shadow-[4px_4px_0px_hsl(var(--shadow-color))]">
                <ImageIcon className="h-12 w-12" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="mt-4 px-4">
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {selectedSection?.title || "No section selected"}
            </p>
            <h2 className="mt-1 font-sans text-2xl font-semibold leading-tight tracking-normal sm:text-3xl">
              {selectedLesson?.title || "No lesson selected"}
            </h2>

            {selectedAttachments.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedAttachments.map((attachment) => (
                  <Link
                    className="inline-flex items-center gap-2 border-3 border-foreground bg-secondary px-3 py-1.5 font-mono text-xs font-bold uppercase text-secondary-foreground shadow-[3px_3px_0px_hsl(var(--shadow-color))] transition-all duration-200 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                    href={`/media/attachments/${attachment.id}`}
                    key={attachment.id}
                  >
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    {attachment.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </section></CourseSidebar>

    </main>
  );
}
