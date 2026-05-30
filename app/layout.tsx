import type { Metadata } from 'next'
import { Bebas_Neue, DM_Mono, Outfit } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { SiteHeader } from '@/components/site-header'
import Link from 'next/link'
import { FooterMinimal } from '@/components/blocks/footer'

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas-neue',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: 'StudyNest',
  description: 'A local-first course video player.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'dark h-full antialiased font-sans',
        bebasNeue.variable,
        outfit.variable,
        dmMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        {/* <FooterMinimal
          links={[{ label: 'GitHub', href: '/' }]}
          copyright="All course materials shown here are from Open Yale Courses and are made available under the Creative Commons BY-NC-SA 3.0 license terms"
          logo="Studynest"
        ></FooterMinimal> */}
        <footer className="border-t-3 border-foreground bg-background px-4 py-3 font-mono text-[11px] font-bold uppercase leading-relaxed text-muted-foreground sm:px-6 lg:px-8 text-center">
          All course materials shown here are from{' '}
          <a
            className="text-foreground underline decoration-2 underline-offset-4"
            href="https://oyc.yale.edu"
          >
            Open Yale Courses
          </a>{' '}
          and are made available under the{' '}
          <a
            className="text-foreground underline decoration-2 underline-offset-4"
            href="https://oyc.yale.edu/terms"
          >
            Creative Commons BY-NC-SA 3.0 license terms
          </a>
          <Link href="gh"> Github</Link>
        </footer>
      </body>
    </html>
  )
}
