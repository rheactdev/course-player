'use client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { sidebarItemVariants, useSidebar } from '@/components/ui/sidebar'

interface SidebarLinkProps
    extends React.ComponentProps<typeof Link> {
    icon?: React.ReactNode
    tooltip?: string
    variant?: 'default' | 'active'
    className?: string
    children: React.ReactNode
}

export function SidebarLink({
    href,
    icon,
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
                isCollapsed && 'justify-center px-2',
                className
            )}
            {...props}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            {!isCollapsed && <span className="truncate">{children}</span>}
        </Link>
    )
}