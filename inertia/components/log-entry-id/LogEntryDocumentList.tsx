import FileItemsList from '~/ui/FileItemList'
import { router } from '@inertiajs/react'
import { LogEntryDocumentJson } from '../../../types/models'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { useState } from 'react'

const deleteDocumentModal = createModal({
  id: 'delete-document-modal',
  isOpenedByDefault: false,
})

export function LogEntryDocumentList({
  documents,
  deleteDocumentUrl,
}: {
  documents: LogEntryDocumentJson[]
  deleteDocumentUrl?: string
}) {
  const [documentIdToDelete, setDocumentIdToDelete] = useState<number | null>(null)

  return (
    <div className="bg-white">
      <FileItemsList
        files={documents.map((document) => ({
          name: document.name,
          href: document.href,
          size: document.sizeInBytes,
          format: 'PDF',
          deletable: deleteDocumentUrl !== undefined,
        }))}
        onDelete={(_, index) => {
          if (!deleteDocumentUrl) return

          setDocumentIdToDelete(documents[index].id)
          deleteDocumentModal.open()
        }}
      />
      <deleteDocumentModal.Component
        title=""
        size="large"
        buttons={[
          { children: 'Annuler', doClosesModal: true, type: 'button' },
          {
            children: 'Supprimer le document',
            onClick: () => {
              if (!deleteDocumentUrl) return

              router.delete(deleteDocumentUrl, {
                data: { documentId: documentIdToDelete },
                onSuccess: () => {
                  setDocumentIdToDelete(null)
                },
              })
            },
            type: 'button',
          },
        ]}
      >
        <Alert
          severity="error"
          title="Suppression d'un document"
          description="Vous êtes sur le point de supprimer ce document, voulez-vous continuer ?"
        />
      </deleteDocumentModal.Component>
    </div>
  )
}
