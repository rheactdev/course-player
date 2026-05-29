"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Courses" },
];

type SiteHeaderProps = {
  activeHref?: string;
};

export function SiteHeader({ activeHref = "/" }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  function toggleTheme() {
    const nextIsDark = !isDark;

    document.documentElement.classList.toggle("dark", nextIsDark);
    setIsDark(nextIsDark);
  }

  return (
    <header className="sticky top-0 z-50 border-b-3 border-foreground bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-3 lg:px-6 align-middle">
        <Link
          aria-label="BoldKit home"
          href="/"
          className="group flex shrink-0 items-center gap-2 align-middle"
        >
          <Image
            alt="BoldKit logo"
            className="h-7 w-7 transition-transform duration-200 group-hover:rotate-[-6deg]"
            height={28}
            src="icons8-origami.svg"
            width={28}
          />
          <span className="font-heading text-2xl leading-none tracking-wider">
            StudyNest
          </span>
        </Link>

        <nav className="hidden items-center lg:flex" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = item.href === activeHref;

            return (
              <Link
                key={item.href}
                className={cn(
                  "relative flex h-14 items-center px-3 text-sm font-bold tracking-wide transition-colors duration-150",
                  isActive
                    ? "text-primary hover:text-primary"
                    : "text-foreground/70 hover:text-foreground",
                )}
                href={item.href}
              >
                {item.label}
                {isActive ? (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">

          <button
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-8 w-8 shrink-0 items-center justify-center border-3 border-foreground bg-background transition-colors duration-150 hover:bg-foreground hover:text-background"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            type="button"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>

          <button
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
          <div className="container mx-auto grid px-3 py-2">
            {navItems.map((item) => {
              const isActive = item.href === activeHref;

              return (
                <Link
                  key={item.href}
                  className={cn(
                    "border-b-2 border-foreground/20 px-2 py-3 text-sm font-bold tracking-wide transition-colors last:border-b-0",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground",
                  )}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
