'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon, Settings } from 'lucide-react'

import { CourseTagSelector } from '@/components/CourseTagSelector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { SerializedCourse } from '@/lib/server/serialize'

type CourseCardProps = {
  course: SerializedCourse
  availableTags: string[]
}

export function CourseCard({ course, availableTags }: CourseCardProps) {
  return (
    <Card className="relative min-h-[24rem] bg-card">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            aria-label={`Edit tags for ${course.courseName}`}
            className="absolute right-3 top-3 z-20 bg-background/95"
            size="icon"
            variant="outline"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[min(92vw,28rem)] overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>Course Tags</SheetTitle>
            <SheetDescription>{course.courseName}</SheetDescription>
          </SheetHeader>
          <CourseTagSelector
            availableTags={availableTags}
            courseSlug={course.slug}
            initialTags={course.tags}
            variant="plain"
          />
        </SheetContent>
      </Sheet>

      <Link
        aria-label={`Open ${course.courseName}`}
        className="block h-full transition-all duration-200 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
        href={`/courses/${course.slug}`}
      >
        <CardContent className="p-0">
          <div className="relative flex aspect-[4/3] overflow-hidden bg-muted">
            {course.coverPath ? (
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw"
                src={`/media/covers/${course.id}`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center border-3 border-foreground bg-accent text-accent-foreground shadow-[3px_3px_0px_hsl(var(--shadow-color))]">
                  <ImageIcon className="h-8 w-8" aria-hidden="true" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardHeader className="border-b-0 border-t-3">
          <CardTitle>{course.creator || 'Unknown'}</CardTitle>
          <CardDescription>{course.courseName}</CardDescription>
          {course.tags.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <Badge key={tag} variant="success">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardHeader>
      </Link>
    </Card>
  )
}
