'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type CourseTagSelectorProps = {
  courseSlug: string
  initialTags: string[]
  availableTags: string[]
  variant?: 'card' | 'plain'
}

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function uniqueTags(tags: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const tag of tags.map(normalizeTag).filter(Boolean)) {
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }

  return result.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export function CourseTagSelector({
  courseSlug,
  initialTags,
  availableTags,
  variant = 'card',
}: CourseTagSelectorProps) {
  const router = useRouter()
  const [tags, setTags] = useState(() => uniqueTags(initialTags))
  const [draftTag, setDraftTag] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')

  const selectableTags = useMemo(() => {
    const selected = new Set(tags.map((tag) => tag.toLowerCase()))
    return uniqueTags(availableTags).filter((tag) => !selected.has(tag.toLowerCase()))
  }, [availableTags, tags])

  function save(nextTags: string[]) {
    const normalizedTags = uniqueTags(nextTags)
    setTags(normalizedTags)
    setStatus('saving')

    void fetch(`/api/courses/${courseSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: normalizedTags }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Tag save failed: ${response.status}`)
        return response.json()
      })
      .then(() => {
        setStatus('idle')
        router.refresh()
      })
      .catch(() => setStatus('error'))
  }

  function addTag(tag: string) {
    const nextTag = normalizeTag(tag)
    if (!nextTag) return
    save([...tags, nextTag])
    setDraftTag('')
  }

  function removeTag(tag: string) {
    save(tags.filter((currentTag) => currentTag.toLowerCase() !== tag.toLowerCase()))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    addTag(draftTag)
  }

  return (
    <section
      className={cn(
        'mt-5',
        variant === 'card' &&
          'border-3 border-foreground bg-card p-3 shadow-[4px_4px_0px_hsl(var(--shadow-color))] sm:p-4',
      )}
    >
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-mono text-xs font-bold uppercase text-foreground">Course Tags</h3>
        <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
          Select or create
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tags.length ? (
            tags.map((tag) => (
              <Badge className="gap-2" key={tag} variant="success">
                {tag}
                <button
                  aria-label={`Remove ${tag}`}
                  className="inline-flex h-4 w-4 items-center justify-center"
                  onClick={() => removeTag(tag)}
                  type="button"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            ))
          ) : (
            <p className="font-mono text-xs font-bold uppercase text-muted-foreground">
              No tags yet
            </p>
          )}
        </div>

        {selectableTags.length ? (
          <div className="flex flex-wrap gap-2">
            {selectableTags.map((tag) => (
              <button
                className="border-2 border-foreground bg-background px-2.5 py-0.5 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_hsl(var(--shadow-color))] transition-all duration-200 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                key={tag}
                onClick={() => addTag(tag)}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}

        <form className="flex max-w-md flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
          <Input
            aria-label="New course tag"
            maxLength={40}
            onChange={(event) => setDraftTag(event.target.value)}
            placeholder="Add a tag"
            value={draftTag}
          />
          <Button
            className="shrink-0"
            disabled={!normalizeTag(draftTag) || status === 'saving'}
            size="sm"
            type="submit"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </Button>
        </form>

        {status === 'error' ? (
          <p className="font-mono text-xs font-bold uppercase text-destructive">
            Could not save tags
          </p>
        ) : null}
      </div>
    </section>
  )
}
