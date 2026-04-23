import ListItem from '~/ui/ListItem'
import { ParcelleJson } from '../../../types/models'
import { useState } from 'react'
import { usePage } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import CommentFormModal from '../parcelle/comment-form-modal'
import ExploitationsController from '#controllers/exploitations_controller'
import { FlashMessages } from '../flash-message'
import { getCultureByCode } from '~/functions/cultures-group'
export type ProjetParcellesListProps = {
  parcelles: ParcelleJson[]
}

const handleCommentModal = createModal({
  id: 'add-comment-modal',
  isOpenedByDefault: false,
})

export default function ProjetParcellesList({ parcelles }: ProjetParcellesListProps) {
  const { flashMessages } = usePage<InferPageProps<ExploitationsController, 'get'>>().props
  const [selectedParcelle, setSelectedParcelle] = useState<ParcelleJson | null>(null)

  const handleDetachParcelle = () => {
    // TODO: This function should be implemented in the backend to detach a parcelle from a project, and the endpoint should be defined accordingly. The current implementation is just a placeholder and may not work as expected.
  }

  return (
    <div className="flex flex-col gap-4">
      <FlashMessages flashMessages={flashMessages} context="parcelle" />
      {parcelles.map((parcelle) => (
        <ListItem
          key={`${parcelle.rpgId}-${parcelle.year}`}
          hasBorder
          variant="compact"
          title={`Parcelle RPG ${parcelle.rpgId}`}
          linkProps={{
            href: `/visualisation?exploitationId=${parcelle.exploitationId}&parcelleId=${parcelle.rpgId}&millesime=${parcelle.year}`,
          }}
          actions={[
            {
              label: parcelle.comment ? 'Modifier le commentaire' : 'Ajouter un commentaire',
              iconId: parcelle.comment ? 'fr-icon-edit-line' : 'fr-icon-add-line',
              onClick: () => {
                setSelectedParcelle(parcelle)
                handleCommentModal.open()
              },
            },
          ]}
          tags={[getCultureByCode(parcelle.cultureCode)]}
          metas={[
            { content: `${parcelle?.surface || 'N/A'} ha`, iconId: 'fr-icon-ruler-line' },
            { content: parcelle.year.toString(), iconId: 'fr-icon-calendar-line' },
            ...(parcelle.comment
              ? [
                  {
                    content: 'Commentaire',
                    iconId: 'fr-icon-draft-line',
                  },
                ]
              : []),
          ]}
        />
      ))}
      <CommentFormModal
        parcelle={selectedParcelle}
        exploitationId={selectedParcelle?.exploitationId ?? ''}
        handleCommentModal={handleCommentModal}
      />
    </div>
  )
}
