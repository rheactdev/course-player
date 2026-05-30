import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { cn } from '@/lib/utils'
import { SidebarLink, SidebarRowLink } from './SidebarLink'
import { Checkbox } from './ui/checkbox'
import { Table, TableBody, TableCell, TableRow } from './ui/table'
import Link from 'next/link'
import SidebarCheckbox from './SidebarCheckbox'
import { AttachmentRecord } from '@/lib/server/types'
import { serializeAttachment, SerializedAttachment } from '@/lib/server/serialize'

type Id = string | number

type CourseSection = {
  id: Id
  section_index: Id
  title: string
}

type CourseLesson = {
  id: Id
  section_id: Id
  title: string
}

type CourseSidebarAccordionProps = {
  sections: CourseSection[]
  lessons: CourseLesson[]
  courseSlug: string
  selectedLessonId?: Id
  completedLessonIds?: Id[]
  className?: string
  attachments?: AttachmentRecord[]
}

function filterAttachments(attachment: AttachmentRecord, courseId: number) {
  if (attachment.course_id != courseId) {
    return
  }
  const serializedAttachment = serializeAttachment(attachment)
  return serializeAttachment
}

export function CourseSidebarAccordion({
  sections,
  lessons,
  courseSlug,
  selectedLessonId,
  completedLessonIds = [],
  className,
  attachments,
}: CourseSidebarAccordionProps) {
  const completedLessonIdSet = new Set(completedLessonIds.map(String))

  const defaultOpenSections = sections.map((section) => `section-${section.id}`)

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpenSections}
      className={cn(className, 'border-0')}
    >
      {sections.map((section) => {
        const sectionLessons = lessons.filter((lesson) => lesson.section_id === section.id)

        return (
          <AccordionItem
            key={section.id}
            value={`section-${section.id}`}
            className="border-r-0 border-l-0 first:border-t-0 last:border-b-0 shadow-none"
          >
            <AccordionTrigger className="text-left text-sm text-accent-foreground">
              <span>{section.title}</span>
            </AccordionTrigger>

            <AccordionContent className="first:pt-0 px-0 m-0 last:pb-0">
              <ul className="overflow-hidden rounded-md">
                {sectionLessons.map((lesson) => {
                  const href = `/courses/${courseSlug}?lesson=${lesson.id}`
                  const isSelected = selectedLessonId === lesson.id
                  const isCompleted = completedLessonIdSet.has(String(lesson.id))
                  const lessonAttachments: SerializedAttachment[] = []

                  if (attachments) {
                    for (const record of attachments) {
                      if (record.lesson_id === lesson.id) {
                        lessonAttachments.push(serializeAttachment(record))
                      }
                    }
                  }
                  return (
                    <SidebarRowLink
                      key={lesson.id}
                      href={href}
                      isSelected={isSelected}
                      isCompleted={isCompleted}
                      title={lesson.title}
                      attachments={lessonAttachments}
                    />
                  )
                })}
              </ul>
              {/* <Table className="border-0">
                <TableBody className="border-0">
                  {sectionLessons.map((lesson) => {
                    const isSelected = selectedLessonId === lesson.id
                    const isCompleted = completedLessonIdSet.has(String(lesson.id))
                    const href = `/courses/${courseSlug}?lesson=${lesson.id}`

                    return (
                      <TableRow key={lesson.id} className="border-2 border-muted">
                        <TableCell className="border-r-2 border-muted p-0">
                          <Link href={href}>
                            <SidebarCheckbox isCompleted={isCompleted} isSelected={isSelected} />
                          </Link>
                        </TableCell>
                        <TableCell className="p-0 relative p-0">
                          <Link href={href} className="absolute inset-0 z-10" />
                          <span>{lesson.title}</span>
                        </TableCell>
                      </TableRow>
                    )

                    // return (
                    //   <SidebarLink
                    //     key={lesson.id}
                    //     href={`/courses/${courseSlug}?lesson=${lesson.id}`}
                    //     className={cn(
                    //       'gap-2 m-0 align-middle',
                    //       isSelected
                    //         ? 'bg-primary text-primary-foreground hover:bg-primary'
                    //         : isCompleted && 'text-muted-foreground',
                    //     )}
                    //     trailingIcon={
                    //       isCompleted ? (
                    //         <Checkbox
                    //           disabled
                    //           checked={true}
                    //           className={cn(
                    //             'h-5 w-5 hover:translate-x-0 hover:translate-y-0 shadow-none',
                    //             isSelected && 'disabled:opacity-100',
                    //           )}
                    //         />
                    //       ) : (
                    //         <Checkbox
                    //           disabled
                    //           checked={false}
                    //           className="border-2 hover:translate-x-0 hover:translate-y-0 shadow-none align-middle disabled:opacity-100"
                    //         />
                    //       )
                    //     }
                    //   >
                    //     {lesson.title}
                    //   </SidebarLink>
                    // )
                  })}
                </TableBody>
              </Table> */}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
