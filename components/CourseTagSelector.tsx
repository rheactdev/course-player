'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxMultiTrigger,
} from '@/components/ui/combobox'

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
  const [open, setOpen] = useState(false)
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
  }

  function removeTag(tag: string) {
    save(tags.filter((currentTag) => currentTag.toLowerCase() !== tag.toLowerCase()))
  }

  return (
    <div className={cn('flex flex-col gap-2', variant === 'card' && 'mt-5')}>
      {variant === 'card' && (
        <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-mono text-xs font-bold uppercase text-foreground">Course Tags</h3>
        </div>
      )}

      <Combobox open={open} onOpenChange={setOpen}>
        <ComboboxMultiTrigger
          className={cn(
            variant === 'card' &&
              'border-3 border-foreground bg-card shadow-[4px_4px_0px_hsl(var(--shadow-color))]'
          )}
          onRemove={removeTag}
          open={open}
          placeholder="Select tags..."
          values={tags.map((tag) => ({ value: tag, label: tag }))}
        />
        <ComboboxContent className="w-[300px]">
          <ComboboxInput placeholder="Search tags..." />
          <ComboboxList>
            <ComboboxEmpty>No tags found.</ComboboxEmpty>
            <ComboboxGroup>
              {selectableTags.map((tag) => (
                <ComboboxItem
                  key={tag}
                  value={tag}
                  onSelect={() => {
                    addTag(tag)
                    setOpen(false)
                  }}
                >
                  {tag}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {status === 'error' ? (
        <p className="font-mono text-xs font-bold uppercase text-destructive mt-1">
          Could not save tags
        </p>
      ) : null}
    </div>
  )
}
