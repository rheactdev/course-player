'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GitBranch, Menu, Moon, Sun, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppBreadcrumb } from './AppBreadcrumb'
import { Button } from './ui/button'

interface NavItem {
  href: string
  label: string
}

const navItems: NavItem[] = []

export function SiteHeader() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)

  function toggleTheme() {
    const nextIsDark = !isDark

    document.documentElement.classList.toggle('dark', nextIsDark)
    setIsDark(nextIsDark)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-3 border-foreground bg-background">
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-primary"></div>
        <div className="flex-1 bg-secondary"></div>
        <div className="flex-1 bg-accent"></div>
        <div className="flex-1 bg-success"></div>
        <div className="flex-1 bg-info"></div>
      </div>
      <div className="flex h-14 w-full items-center justify-between px-4 align-middle sm:px-6 lg:px-8">
        <Link
          aria-label="BoldKit home"
          href="/courses"
          className="group flex shrink-0 items-center gap-2 align-middle"
        >
          <Image
            alt="BoldKit logo"
            className="h-7 w-7 transition-transform duration-200 group-hover:rotate-[-6deg]"
            height={28}
            src="/icons8-origami.svg"
            width={28}
          />
          <span className="font-heading text-2xl leading-none tracking-wider">StudyNest</span>
        </Link>

        <nav className="hidden items-center lg:flex" aria-label="Main navigation">
          <AppBreadcrumb />
        </nav>

        <div className="flex items-center gap-1.5">
          <Link href="/admin" className="cursor-pointer">
            <Button size="sm" className="cursor-pointer">
              Admin
            </Button>
          </Link>
          <Button
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            type="button"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </Button>

          <button
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-8 w-8 shrink-0 items-center justify-center border-3 border-foreground bg-background transition-colors duration-150 hover:bg-foreground hover:text-background lg:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            {isMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <nav
          aria-label="Mobile navigation"
          className="border-t-3 border-foreground bg-background lg:hidden"
          id="mobile-menu"
        >
          <div className="grid px-4 py-2 sm:px-6 lg:px-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  className={cn(
                    'border-b-2 border-foreground/20 px-2 py-3 text-sm font-bold tracking-wide transition-colors last:border-b-0',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                  )}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
