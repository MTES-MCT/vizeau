import type { ProjectJson, ProjectStepJson } from '#types/models'
import SectionCard from '~/ui/SectionCard'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import CustomTag from '~/ui/CustomTag'
import { Card } from '@codegouvfr/react-dsfr/Card'

import MetasList from '~/ui/MetasList'
import { formatDateFr } from '~/functions/date'
export type ProjetsEnCoursProps = {
  projets: ProjectJson[]
}

function getNextStep(steps: ProjectStepJson[]): ProjectStepJson | undefined {
  return steps
    .filter(
      (step): step is ProjectStepJson & { date: string } => !step.isValidated && step.date !== null
    )
    .sort((a, b) => a.date.localeCompare(b.date))[0]
}

export default function ProjetsEnCours({ projets }: ProjetsEnCoursProps) {
  return (
    <SectionCard title="Projets en cours" size="small" actionLabel="Voir tous les projets">
      {projets.length > 0 ? (
        <div className="fr-grid-row fr-grid-row--gutters">
          {projets.map(
            ({
              id,
              name,
              description,
              actionType,
              steps,
              exploitations,
              updatedAt,
              parcelles,
              captages,
            }) => {
              const nextStep = getNextStep(steps)

              return (
                <div key={id} className="fr-col-6">
                  <Card
                    background
                    border
                    desc={description}
                    enlargeLink
                    linkProps={{
                      href: `/projets/${id}`,
                    }}
                    size="small"
                    title={name}
                    end={
                      <MetasList
                        size="xs"
                        metas={[
                          {
                            content: `${formatDateFr(updatedAt)}`,
                            iconId: 'fr-icon-time-line',
                          },
                          ...(parcelles.length > 0
                            ? [
                                {
                                  content: `${parcelles.length} parcelle${parcelles.length > 1 ? 's' : ''}`,
                                  iconId: 'fr-icon-collage-line',
                                },
                              ]
                            : []),
                          ...(captages.length > 0
                            ? [
                                {
                                  content: `${captages.length} point${captages.length > 1 ? 's' : ''} de prélèvement`,
                                  iconId: 'fr-icon-drop-line',
                                },
                              ]
                            : []),
                          ...(exploitations.length > 0
                            ? [
                                {
                                  content: `${exploitations.length} exploitation${exploitations.length > 1 ? 's' : ''}`,
                                  iconId: 'fr-icon-map-pin-user-line',
                                },
                              ]
                            : []),
                        ]}
                      />
                    }
                    start={
                      <ul className="fr-badges-group">
                        <li>
                          <CustomTag label={actionType || "Type d'action non renseigné"} />
                        </li>
                      </ul>
                    }
                    detail={
                      nextStep ? <div className="fr-mt-2v">&rarr; {nextStep.title}</div> : undefined
                    }
                  />
                </div>
              )
            }
          )}
        </div>
      ) : (
        <EmptyPlaceholder label="Aucun projet en cours." />
      )}
    </SectionCard>
  )
}
