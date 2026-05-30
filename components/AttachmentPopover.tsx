import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { FileIcon, PaperclipIcon } from 'lucide-react'

export default function AttachmentPopover() {
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
