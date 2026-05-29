import {
    Sidebar, SidebarProvider, SidebarHeader, SidebarContent,
    SidebarItem, SidebarToggle, SidebarInset,
    SidebarGroup,
    SidebarGroupLabel
} from '@/components/ui/sidebar'
import { Home, Settings } from 'lucide-react'

import type { AttachmentRecord, CourseRecord, LessonRecord, SectionRecord } from "@/lib/server/types";
import { SerializedAttachment, SerializedCourse, SerializedProgress } from '@/lib/server/serialize';
// import { useRouter } from 'next/navigation';
import { SidebarLink } from './SidebarLink';


interface CourseSidebarProps {
    courseName: string;
    course?: SerializedCourse;
    sections: SectionRecord[];
    lessons: LessonRecord[];
    selectedLesson?: LessonRecord;
    children?: React.ReactNode;
}

export default function CourseSidebar({ courseName, sections, lessons, selectedLesson, course, children }: CourseSidebarProps) {

    // const router = useRouter();
    return (
        <SidebarProvider>
            <Sidebar>
                {/* <SidebarHeader>{courseName}</SidebarHeader> */}
                <SidebarContent>
                    {sections.map((section) => {
                        const sectionLessons = lessons.filter((lesson) => lesson.section_id === section.id);
                        return <SidebarGroup key={section.id}>
                            <SidebarGroupLabel>{section.section_index} {section.title}</SidebarGroupLabel>
                            {sectionLessons.map((lesson) => {
                                const isSelected = selectedLesson?.id === lesson.id;
                                return <SidebarLink key={lesson.id} href={`/courses/${course?.slug}?lesson=${lesson.id}`} className={isSelected ? "bg-primary text-primary-foreground hover:bg-primary" : "bg-background"}><span className='block w-full whitespace-normal break-words text-left'>{lesson.title}
                                </span></SidebarLink>
                            })}
                        </SidebarGroup>
                    })}
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}