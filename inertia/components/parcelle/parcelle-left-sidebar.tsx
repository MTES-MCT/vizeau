import { RefObject, useEffect, useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import { router } from '@inertiajs/react'
import { ExploitationJson, ParcelleJson } from '../../../types/models'
import { VisualisationMapRef } from '~/components/map/VisualisationMap'
import SmallSection from '~/ui/SmallSection'
import LabelInfo from '~/ui/LabelInfo'
import cultures from '../../../database/data/cultures.json'
import CustomTag from '~/ui/CustomTag'
import Button from '@codegouvfr/react-dsfr/Button'
import Alert from '@codegouvfr/react-dsfr/Alert'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import Input from '@codegouvfr/react-dsfr/Input'

const handleCommentModal = createModal({
  id: 'add-comment-modal',
  isOpenedByDefault: false,
})

export type ParcelleLeftSidebarProps = {
  parcelle: ParcelleJson
  exploitation: ExploitationJson
  mapRef: RefObject<VisualisationMapRef>
}

export default function ParcelleLeftSidebar({
  parcelle,
  exploitation,
  mapRef,
}: ParcelleLeftSidebarProps) {
  const [comment, setComment] = useState(parcelle?.comment)
  const cultureLabel = cultures.find((culture) => culture.code === parcelle.cultureCode)?.label

  useEffect(() => {
    setComment(parcelle?.comment)
  }, [parcelle?.comment])

  const handleEditComment = () => {
    const trimmedComment = comment?.trim()
     router.patch(
      `/exploitations/${exploitation.id}/parcelles/${parcelle.rpgId}/note`,
      { year: parcelle.year, comment: trimmedComment ? trimmedComment : null },
      {
        preserveState: true,
        preserveScroll: true,
        only: ['filteredExploitations'],
        onSuccess: () => {
          handleCommentModal.close()
        },
      }
    )
  }

  return (
    <div className="fr-p-1w">
      <Breadcrumb
        currentPageLabel={parcelle.rpgId}
        segments={[
          {
            label: 'Liste des exploitations agricoles',
            linkProps: {
              href: '#',
              onClick: () => {
                router.visit(`/visualisation?millesime=${parcelle.year}`)
              },
              style: {
                cursor: 'pointer',
                fontSize: 'inherit',
                color: 'inherit',
              },
            },
          },
          {
            label: exploitation.name,
            linkProps: {
              href: '#',
              onClick: () => {
                router.visit(
                  `/visualisation?exploitationId=${exploitation.id}&millesime=${parcelle.year}&tab=parcelles`,
                  {
                    preserveScroll: true,
                  }
                )
              },
              style: {
                cursor: 'pointer',
                fontSize: 'inherit',
                color: 'inherit',
              },
            },
          },
        ]}
        className={'fr-my-0'}
      />

      <div
        className="fr-p-1w fr-m-1w"
        style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        {parcelle.rpgId && <h4 className="fr-h3">{`Parcelle RPG ${parcelle.rpgId}`}</h4>}

        <div
          className="flex flex-col gap-3 fr-mb-3v fr-pb-3v"
          style={{
            borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          }}
        >
          <Button
            priority="secondary"
            size="small"
            iconId="fr-icon-crosshair-2-line"
            className="flex justify-center"
            onClick={() => mapRef.current?.centerOnParcelle(parcelle)}
            style={{ whiteSpace: 'nowrap', width: '100%' }}
            disabled={!parcelle.centroid}
          >
            Centrer sur la parcelle
          </Button>

          {!parcelle.centroid && (
            <Alert
              small
              severity="info"
              description="La parcelle n'a pas de coordonnées définies. Impossible de centrer la carte sur cette parcelle."
            />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <SmallSection
            title="Informations générales"
            iconId="fr-icon-pass-pending-line"
            priority="secondary"
            hasBorder
          >
            <div className="flex flex-col gap-2">
              <LabelInfo
                label="Type de culture"
                size="sm"
                icon="fr-icon-plant-line"
                info={cultureLabel ? <CustomTag label={cultureLabel} /> : 'N/A'}
              />

              <LabelInfo
                label="Année de déclaration"
                size="sm"
                icon="fr-icon-calendar-line"
                info={`${parcelle.year || 'N/A'}`}
              />

              <LabelInfo
                label="Surface admissible PAC"
                size="sm"
                icon="fr-icon-ruler-line"
                info={`${parcelle?.surface || 'N/A'} ha`}
              />
            </div>
          </SmallSection>

          <SmallSection
            iconId="fr-icon-draft-line"
            actionIcon={parcelle?.comment ? 'fr-icon-edit-line' : ''}
            handleAction={handleCommentModal.open}
            title="Commentaire"
            priority="secondary"
            hasBorder
          >
            <div className="flex flex-col gap-2">
              {parcelle?.comment ? (
                <p>{parcelle.comment}</p>
              ) : (
                <EmptyPlaceholder
                  label="Aucun commentaire pour cette parcelle."
                  buttonLabel="Ajouter un commentaire"
                  handleClick={handleCommentModal.open}
                  buttonIcon="fr-icon-add-line"
                  illustrativeIcon="fr-icon-draft-line"
                />
              )}
            </div>
          </SmallSection>
        </div>
      </div>
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
    </div>
  )
}
