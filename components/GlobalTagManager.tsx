'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type GlobalTagManagerProps = {
  initialTags: string[]
}

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function GlobalTagManager({ initialTags }: GlobalTagManagerProps) {
  const router = useRouter()
  const [tags, setTags] = useState(initialTags)
  const [draftTag, setDraftTag] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')

  useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  function addTag(tag: string) {
    const nextTag = normalizeTag(tag)
    if (!nextTag || tags.some(t => t.toLowerCase() === nextTag.toLowerCase())) return

    setTags([...tags, nextTag])
    setDraftTag('')
    setStatus('saving')

    fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: nextTag }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to create tag')
        setStatus('idle')
        router.refresh()
      })
      .catch(() => setStatus('error'))
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t.toLowerCase() !== tag.toLowerCase()))
    setStatus('saving')

    fetch('/api/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to delete tag')
        setStatus('idle')
        router.refresh()
      })
      .catch(() => setStatus('error'))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    addTag(draftTag)
  }

  return (
    <Card className="mb-8 border-3 border-foreground bg-card shadow-[4px_4px_0px_hsl(var(--shadow-color))]">
      <CardHeader className="border-b-3 border-foreground">
        <CardTitle className="font-heading tracking-wide uppercase">Global Tags</CardTitle>
        <CardDescription>
          Create or delete tags globally. Deleting a tag here will remove it from all courses.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.length ? (
              tags.map((tag) => (
                <Badge className="gap-2 text-sm" key={tag} variant="success">
                  {tag}
                  <button
                    aria-label={`Delete global tag ${tag}`}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-sm hover:bg-black/20"
                    onClick={() => removeTag(tag)}
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </Badge>
              ))
            ) : (
              <p className="font-mono text-sm font-bold uppercase text-muted-foreground">
                No tags created yet
              </p>
            )}
          </div>

          <form className="flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <Input
              aria-label="New global tag"
              maxLength={40}
              onChange={(event) => setDraftTag(event.target.value)}
              placeholder="Create a new tag"
              value={draftTag}
            />
            <Button
              className="shrink-0"
              disabled={!normalizeTag(draftTag) || status === 'saving'}
              type="submit"
            >
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Create Tag
            </Button>
          </form>

          {status === 'error' ? (
            <p className="font-mono text-xs font-bold uppercase text-destructive">
              An error occurred while saving
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
