'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ScanButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function scan() {
    setError(null)
    setIsScanning(true)

    try {
      const response = await fetch('/api/scan', { method: 'POST' })
      if (!response.ok) {
        setError('Scan failed')
        return
      }

      startTransition(() => {
        router.refresh()
      })
    } catch {
      setError('Scan failed')
    } finally {
      setIsScanning(false)
    }
  }

  const isBusy = isScanning || isPending

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button disabled={isBusy} onClick={scan} size="sm" type="button" variant="secondary">
        <RefreshCw className={isBusy ? 'animate-spin' : ''} aria-hidden="true" />
        {isBusy ? 'Scanning' : 'Scan'}
      </Button>
      {error ? (
        <p className="font-mono text-xs font-bold uppercase text-destructive">{error}</p>
      ) : null}
    </div>
  )
}
