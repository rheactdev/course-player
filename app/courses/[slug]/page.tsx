import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FileDown, ImageIcon, Paperclip, Play, PlayCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/lib/server/db";
import { serializeCourse } from "@/lib/server/serialize";
import type { AttachmentRecord, CourseRecord, LessonRecord, SectionRecord } from "@/lib/server/types";

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
        SELECT * FROM lessons
        WHERE course_id = ?
        ORDER BY sort_order ASC, title COLLATE NOCASE ASC
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

function lessonNumber(section: SectionRecord, lesson: LessonRecord) {
  return `${section.section_index}-${lesson.lesson_index}`;
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

  return (
    <>
      <SiteHeader activeHref="/" />
      <main className="flex-1 bg-background">
        <section className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 border-b-3 border-foreground pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <Link
                className="font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                href="/"
              >
                Courses
              </Link>
              <h1 className="mt-2 font-sans text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
                {course.courseName}
              </h1>
              <p className="mt-2 text-base font-medium text-muted-foreground">
                {course.creator || "Unknown creator"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(course.tags.length ? course.tags.slice(0, 4) : ["Course"]).map((tag, index) => (
                <Badge
                  key={tag}
                  variant={index === 0 ? "default" : index === 1 ? "secondary" : "accent"}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="min-w-0">
              <Card className="bg-card">
                <CardContent className="p-3 sm:p-4">
                  <div className="relative flex aspect-video items-center justify-center overflow-hidden border-3 border-foreground bg-muted">
                    {selectedLesson && !selectedLesson.unavailable ? (
                      <video
                        className="h-full w-full bg-black"
                        controls
                        preload="metadata"
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

                  <div className="mt-4">
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
                </CardContent>
              </Card>
            </section>

            <aside>
              <Accordion
                type="multiple"
                defaultValue={sections.map((section) => `section-${section.id}`)}
              >
                {sections.map((section) => {
                  const sectionLessons = lessons.filter((lesson) => lesson.section_id === section.id);

                  return (
                    <AccordionItem key={section.id} value={`section-${section.id}`}>
                      <AccordionTrigger className="gap-3 px-3 py-3 text-left">
                        <span className="font-mono text-xs text-muted-foreground">
                          {section.section_index}
                        </span>
                        <span className="mr-auto font-sans text-lg font-semibold normal-case tracking-normal">
                          {section.title}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="bg-background p-0">
                        {sectionLessons.map((lesson) => {
                          const lessonAttachments = attachments.filter(
                            (attachment) => attachment.lesson_id === lesson.id,
                          );
                          const isSelected = selectedLesson?.id === lesson.id;

                          return (
                            <Link
                              className={[
                                "grid grid-cols-[1fr_auto] gap-3 border-b-2 border-foreground px-3 py-3 text-foreground transition-colors last:border-b-0 hover:bg-muted",
                                isSelected ? "bg-primary text-primary-foreground hover:bg-primary" : "bg-background",
                                lesson.unavailable ? "opacity-50" : "",
                              ].join(" ")}
                              href={`/courses/${course.slug}?lesson=${lesson.id}`}
                              key={lesson.id}
                            >
                              <div className="min-w-0">
                                <h3 className="font-sans text-base font-semibold leading-tight tracking-normal">
                                  {lessonNumber(section, lesson)} {lesson.title}
                                </h3>
                                <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[0.7rem] font-bold uppercase text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                                    {lesson.duration_seconds
                                      ? `${Math.round(lesson.duration_seconds / 60)} min`
                                      : "Video"}
                                  </span>
                                  {lessonAttachments.length ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                                      Attachments
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <span
                                className={[
                                  "flex h-9 w-9 shrink-0 items-center justify-center border-2 border-foreground",
                                  isSelected ? "bg-background text-foreground" : "bg-accent text-accent-foreground",
                                ].join(" ")}
                              >
                                <PlayCircle className="h-5 w-5" aria-hidden="true" />
                              </span>
                            </Link>
                          );
                        })}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
