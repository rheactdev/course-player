'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SerializedCourse } from '@/lib/server/serialize'

type CourseCardProps = {
  course: SerializedCourse
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.slug}`} className="block h-full outline-none">
      <Card interactive className="flex h-full flex-col">
        <CardContent className="p-0">
          <div className="relative flex w-full aspect-[4/3] overflow-hidden bg-muted">
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
        <CardHeader className="border-b-0 border-t-3 flex-1">
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
      </Card>
    </Link>
  )
}
