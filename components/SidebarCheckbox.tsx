import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function SidebarCheckbox({
  isCompleted,
  isSelected,
}: {
  isCompleted: boolean
  isSelected: boolean
}) {
  return (
    <Checkbox
      disabled
      checked={isCompleted}
      className={cn(
        'hover:translate-x-0 hover:translate-y-0 shadow-none pointer-events-none outline-1 outline-muted',
        isSelected ? 'border-foreground bg-background' : '',
        isCompleted ? 'opacity-70 group-hover:opacity-100' : '',
      )}
    />
  )
}
