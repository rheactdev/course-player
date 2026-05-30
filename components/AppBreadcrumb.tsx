'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

type AppBreadcrumbProps = {
  homeLabel?: React.ReactNode
  homeHref?: string
  labels?: Record<string, React.ReactNode>
  hideHome?: boolean
}

function formatSegment(segment: string) {
  return decodeURIComponent(segment)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function AppBreadcrumb({
  homeLabel = 'Home',
  homeHref = '/',
  labels = {},
  hideHome = false,
}: AppBreadcrumbProps) {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`

    return {
      href,
      segment,
      label: labels[href] ?? labels[segment] ?? formatSegment(segment),
      isLast: index === segments.length - 1,
    }
  })

  if (pathname === '/' && hideHome) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {!hideHome && (
          <>
            <BreadcrumbItem>
              {pathname === homeHref ? (
                <BreadcrumbPage>{homeLabel}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={homeHref}>{homeLabel}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>

            {crumbs.length > 0 && <BreadcrumbSeparator />}
          </>
        )}

        {crumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>

            {index < crumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
