import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { PaperclipIcon } from 'lucide-react'
import { AttachmentRecord } from '@/lib/server/types'
import { SerializedAttachment } from '@/lib/server/serialize'
import Link from 'next/link'

export default function AttachmentPopover({
  attachments,
}: {
  attachments: SerializedAttachment[]
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="cursor-pointer shadow-none outline-1 outline-muted" variant="accent">
          <PaperclipIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        {attachments.map((attachment) => {
          return (
            <Link
              key={attachment.id}
              href={`/media/attachments/${attachment.id}`}
              className="cursor-pointer
"
            >
              <Button variant="link" className="cursor-pointer">
                {attachment.name}
              </Button>
            </Link>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
