import { router } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import type { TerritoireJson } from '#types/models'
import type { ConformiteRepartitionJson } from '#types/captage'
import { Link } from '@adonisjs/inertia/react'

import SectionCard from '~/ui/SectionCard'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import LabelInfo from '~/ui/LabelInfo'
import Tag from '@codegouvfr/react-dsfr/Tag'
import '../../ui/ListItem/list-item.css'

export type TerritoiresAlertesProps = {
  territoires: TerritoireJson[]
  conformiteRepartition?: ConformiteRepartitionJson
}

export default function TerritoiresAlertes({
  territoires,
  conformiteRepartition,
}: TerritoiresAlertesProps) {
  const territoiresAvecAlerte = territoires
    .filter((territoire) => {
      const stats = conformiteRepartition?.parTerritoire[territoire.id]

      return (stats?.depassements_alerte ?? 0) > 0 || (stats?.depassements_reglementaires ?? 0) > 0
    })
    .map((territoire) => ({
      ...territoire,
      depassements_alerte:
        conformiteRepartition?.parTerritoire[territoire.id]?.depassements_alerte ?? 0,
      depassements_reglementaires:
        conformiteRepartition?.parTerritoire[territoire.id]?.depassements_reglementaires ?? 0,
    }))

  return (
    <SectionCard title="Mes territoires suivis à risque" size="small">
      {territoiresAvecAlerte.length > 0 ? (
        <div>
          <div
            className="relative fr-mb-6v"
            style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}
          >
            <img src="/Illustration-qualite-assolement.webp" />
            <Tag
              linkProps={{
                href: '/visualisation?millesime=2024&tab=aac&aacDepassementsAlerte=true&aacPage=1&aacDepassementsReglementaires=true',
              }}
              iconId="fr-icon-arrow-right-line"
              className="absolute bottom-3 left-3"
              style={{
                border: `solid 1px ${fr.colors.decisions.border.default.grey.default}`,
                color: fr.colors.decisions.text.label.blueFrance.default,
                background: 'rgba(255, 255, 255, 0.90);',
              }}
            >
              Visualiser les territoires
            </Tag>
          </div>

          <div className="flex flex-col gap-2">
            {territoiresAvecAlerte
              .map(
                ({
                  nom,
                  id,
                  code,
                  surface,
                  nb_communes,
                  nb_captages_actifs,
                  depassements_alerte,
                  depassements_reglementaires,
                }) => {
                  return (
                    <Link
                      key={id}
                      className="fr-p-3v cursor-pointer list-item-effect"
                      style={{
                        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                        background: fr.colors.decisions.background.default.grey.default,
                      }}
                      href={`/aac/${code}`}
                      onClick={() => router.visit(`/aac/${code}`)}
                    >
                      <div className="flex gap-3">
                        <strong>{nom}</strong>
                        <Tag
                          small
                          style={{
                            background: fr.colors.decisions.background.contrast.warning.default,
                            color: fr.colors.decisions.text.default.warning.default,
                          }}
                        >
                          {depassements_alerte + depassements_reglementaires} alerte(s)
                        </Tag>
                      </div>
                      <div className="flex w-full flex-wrap gap-1">
                        <LabelInfo
                          icon="fr-icon-ruler-line"
                          info={surface ? `${surface} ha` : 'Non renseigné'}
                          size="sm"
                        />
                        ·
                        <LabelInfo
                          icon="fr-icon-drop-line"
                          info={nb_captages_actifs?.toString() ?? 'Non renseigné'}
                          size="sm"
                        />
                        ·
                        <LabelInfo
                          icon="fr-icon-government-line"
                          info={nb_communes?.toString() ?? 'Non renseigné'}
                          size="sm"
                        />
                      </div>
                    </Link>
                  )
                }
              )
              .slice(0, 10)}
          </div>
          {territoiresAvecAlerte.length > 10 && (
            <span className="fr-text--xs">
              <span className="fr-icon--sm fr-icon-info-line fr-mr-1v" />
              Seuls les 10 premiers territoires à risque sont affichés
            </span>
          )}
        </div>
      ) : (
        <EmptyPlaceholder label="Aucun territoire suivi ne présente de points de prélèvements à risque." />
      )}
    </SectionCard>
  )
}
