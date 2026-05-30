'use client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { sidebarItemVariants, useSidebar } from '@/components/ui/sidebar'

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
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

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
        <>
          {trailingIcon && <span className="ml-auto shrink-0">{trailingIcon}</span>}
          <span className="min-w-0 flex-1">{children}</span>
        </>
      )}
    </Link>
  )
}
