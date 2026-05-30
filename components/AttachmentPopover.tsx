import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { PaperclipIcon } from 'lucide-react'
import { AttachmentRecord } from '@/lib/server/types'

export default function AttachmentPopover({ attachments }: { attachments: AttachmentRecord[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>
          <PaperclipIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent>Place content for the popover here.</PopoverContent>
    </Popover>
  )
}
