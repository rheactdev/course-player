import { Sidebar, SidebarProvider, SidebarContent, SidebarInset } from '@/components/ui/sidebar'

import type { LessonRecord, SectionRecord } from '@/lib/server/types'
import { SerializedCourse } from '@/lib/server/serialize'
import { CourseSidebarAccordion } from './SidebarAccordianGroup'

interface CourseSidebarProps {
  courseName: string
  course: SerializedCourse
  sections: SectionRecord[]
  lessons: LessonRecord[]
  selectedLesson?: LessonRecord
  completedLessonIds?: number[]
  children?: React.ReactNode
}

export default function CourseSidebar({
  sections,
  lessons,
  selectedLesson,
  course,
  completedLessonIds = [],
  children,
}: CourseSidebarProps) {
  return (
    <SidebarProvider className="h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
      <SidebarInset className="min-h-0 overflow-hidden">{children}</SidebarInset>

      <Sidebar side="right" className="h-full min-h-0 max-h-none">
        <SidebarContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-0 pb-4 border-b-0">
          <CourseSidebarAccordion
            sections={sections}
            lessons={lessons}
            courseSlug={course.slug}
            selectedLessonId={selectedLesson?.id}
            completedLessonIds={completedLessonIds}
          />
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
