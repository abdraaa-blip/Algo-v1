'use client'

import { NotificationPrompt } from '@/components/ui/NotificationPrompt'

export function NotificationPromptWrapper() {
  return (
    <NotificationPrompt
      labels={{
        title: 'Activer les notifications',
        description: 'Recois des alertes quand une tendance explose.',
        enable: 'Activer',
        later: 'Plus tard',
      }}
    />
  )
}
