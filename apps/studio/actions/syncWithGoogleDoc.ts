import { useState } from 'react'
import { 
  useDocumentOperation,
  useDocumentPairPermissions,
} from 'sanity'
import { useToast } from '@sanity/ui'
import { SyncIcon } from '@sanity/icons'
import type { DocumentActionComponent } from 'sanity'

interface DocumentActionProps {
  id: string
  type: string
  published: Record<string, unknown> | null
  draft: Record<string, unknown> | null
  onComplete: () => void
}

export const SyncWithGoogleDocAction: DocumentActionComponent = ({
  id,
  type,
  published,
  draft,
  onComplete,
}: DocumentActionProps) => {
  const [syncing, setSyncing] = useState(false)
  const { patch } = useDocumentOperation(id, type)
  const [permissions] = useDocumentPairPermissions({ id, type, permission: 'update' })
  const toast = useToast()

  const handleSync = async () => {
    setSyncing(true)
    
    try {
      // TODO: Implement actual Google Doc sync logic here
      // For now, just show a toast and complete
      toast.push({
        status: 'info',
        title: 'Sync with Google Doc',
        description: 'Sync functionality will be implemented soon.',
      })
      
      // Simulate async operation
      setTimeout(() => {
        setSyncing(false)
        onComplete()
      }, 1000)
    } catch (error) {
      setSyncing(false)
      toast.push({
        status: 'error',
        title: 'Sync Failed',
        description: 'There was an error syncing with Google Doc.',
      })
    }
  }

  return {
    label: syncing ? 'Syncing...' : 'Sync with Google Doc',
    icon: SyncIcon,
    onHandle: handleSync,
    disabled: syncing || !permissions?.granted,
    shortcut: undefined,
  }
}

export default SyncWithGoogleDocAction
