import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'
import { ParcelleJson } from '../../../types/models'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import Input from '@codegouvfr/react-dsfr/Input'

export type CommentFormProps = {
  parcelle: ParcelleJson | null
  exploitationId: string
  handleCommentModal: ReturnType<typeof createModal>
}

export default function CommentForm({
  parcelle,
  exploitationId,
  handleCommentModal,
}: CommentFormProps) {
  const [comment, setComment] = useState(parcelle?.comment)

  useEffect(() => {
    setComment(parcelle?.comment)
  }, [parcelle?.rpgId, parcelle?.year, parcelle?.comment])

  const handleEditComment = () => {
    if (!parcelle) return
    const trimmedComment = comment?.trim()
    router.patch(
      `/exploitations/${exploitationId}/parcelles/${parcelle.rpgId}/note`,
      { year: parcelle.year, comment: trimmedComment ? trimmedComment : null },
      {
        preserveState: true,
        preserveScroll: true,
        only: ['filteredExploitations', 'flashMessages'],
        onSuccess: () => {
          handleCommentModal.close()
        },
      }
    )
  }

  return (
    <handleCommentModal.Component
      title="Ajouter un commentaire à la parcelle"
      size="large"
      buttons={[
        { children: 'Annuler', doClosesModal: true },
        {
          children: parcelle?.comment ? 'Modifier le commentaire' : 'Ajouter le commentaire',
          onClick: handleEditComment,
        },
      ]}
    >
      <Input
        textArea
        label="Commentaire"
        hintText="Un commentaire peut être ajouté pour fournir des informations supplémentaires sur la parcelle."
        nativeTextAreaProps={{
          value: comment || '',
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value),
          placeholder:
            'Ex : Cette parcelle est en pente, ce qui peut expliquer les faibles rendements observés.',
        }}
      />
    </handleCommentModal.Component>
  )
}
