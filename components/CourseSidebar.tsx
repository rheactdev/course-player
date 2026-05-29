import {
    Sidebar, SidebarProvider, SidebarHeader, SidebarContent,
    SidebarItem, SidebarToggle, SidebarInset,
    SidebarGroup,
    SidebarGroupLabel
} from '@/components/ui/sidebar'
import { Home, Settings } from 'lucide-react'

import type { AttachmentRecord, CourseRecord, LessonRecord, SectionRecord } from "@/lib/server/types";
import { SerializedAttachment, SerializedCourse, SerializedProgress } from '@/lib/server/serialize';


interface CourseSidebarProps {
    courseName: string;
    course?: SerializedCourse;
    sections: SectionRecord[];
    lessons: LessonRecord[];
}

export default function CourseSidebar({ courseName, sections, lessons }: CourseSidebarProps) {


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
                                return <SidebarItem><span className='text-wrap text-left'>{lesson.title}</span></SidebarItem>
                            })}
                        </SidebarGroup>
                    })}
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <SidebarToggle />
                <main>Content</main>
            </SidebarInset>
        </SidebarProvider>
    )
}