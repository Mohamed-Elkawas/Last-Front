import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useTranslate } from '@/hooks/use-translate'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  const { t } = useTranslate()
  return (
    <Loader2Icon
      role="status"
      aria-label={t('common.loading')}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
