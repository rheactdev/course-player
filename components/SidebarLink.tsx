'use client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { sidebarItemVariants } from '@/components/ui/sidebar'
import SidebarCheckbox from './SidebarCheckbox'
import AttachmentPopover from './AttachmentPopover'
import { SerializedAttachment } from '@/lib/server/serialize'

type SidebarLinkProps = React.ComponentProps<typeof Link> & {
  icon?: React.ReactNode
  trailingIcon?: React.ReactNode
  variant?: 'default' | 'active'
  className?: string
  children: React.ReactNode
}

export function SidebarLink({
  href,
  icon,
  trailingIcon,
  variant = 'default',
  className,
  children,
  ...props
}: SidebarLinkProps) {
  const isCollapsed = false

  return (
    <Link
      href={href}
      className={cn(
        sidebarItemVariants({ variant }),
        'w-full',
        isCollapsed && 'justify-center px-2',
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}

      {!isCollapsed && (
        <div className="flex gap-6 items-center">
          {trailingIcon && <span className="ml-auto shrink-0">{trailingIcon}</span>}
          <span className="min-w-0">{children}</span>
        </div>
      )}
    </Link>
  )
}

type LessonRowProps = {
  href: string
  title: string
  isSelected: boolean
  isCompleted: boolean
  attachments?: SerializedAttachment[]
}

export const SidebarRowLink = ({
  href,
  title,
  isSelected,
  isCompleted,
  attachments,
}: LessonRowProps) => {
  const hasAttachments = attachments && attachments.length > 0

  return (
    <li
      className={cn(
        'border-b-2 border-muted last:border-b-0 flex items-stretch hover:bg-secondary hover:text-secondary-foreground transition-colors relative',
        isSelected && 'bg-primary text-primary-foreground',
        isCompleted && 'opacity-70',
      )}
    >
      {/* Clickable area linking to the lesson page */}
      <Link href={href} className="flex flex-1 items-stretch min-w-0">
        <div className="flex px-4 shrink-0 items-center justify-center border-r border-muted py-4">
          <SidebarCheckbox isSelected={isSelected} isCompleted={isCompleted} />
        </div>
        <div className="flex min-w-0 flex-1 items-center px-4 py-4">
          <span className="line-clamp-2">{title}</span>
        </div>
      </Link>

      {/* Attachment area rendered outside the row Link */}
      {hasAttachments ? (
        <div className="flex px-4 shrink-0 items-center justify-center border-l border-muted py-4 relative z-20">
          <AttachmentPopover attachments={attachments} />
        </div>
      ) : null}
    </li>
  )
}
