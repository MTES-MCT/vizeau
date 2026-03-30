import LabelInfo from '~/ui/LabelInfo'
import { formatDateFr } from '~/functions/date'
import SmallSection from '~/ui/SmallSection'
import ResumeCard from '~/ui/ResumeCard'
import { map } from 'lodash-es'

export type AacInformationsCardProps = {
  code: string
  date_creation: string
  date_maj: string
  nb_captages_actifs: number | null
  nb_parcelles: number
  surface: number | null
  surface_agricole_bio: {
    surface: number | null
    part_bio: number | null
  } | null
  communes: {
    nb_communes: number
    communes: Record<
      string,
      {
        surface: number
        code_insee: string
        repartition: number
      }
    >
  }
  extended?: boolean
}

export default function AacInformationsCard({
  code,
  date_creation,
  date_maj,
  extended = false,
  nb_captages_actifs,
  nb_parcelles,
  surface_agricole_bio,
  surface,
  communes,
}: AacInformationsCardProps) {
  const communeArray = map(communes?.communes ?? {}, (info, nom) => ({ nom, ...info }))

  return (
    <SmallSection
      title="Informations générales"
      iconId="fr-icon-passport-line"
      priority="secondary"
      hasBorder
    >
      <div className="flex flex-col gap-2">
        <LabelInfo label="Code AAC" info={code} />
        <LabelInfo label="Date de création" info={formatDateFr(date_creation)} />
        <LabelInfo label="Dernière mise à jour" info={formatDateFr(date_maj)} />
        {extended && (
          <LabelInfo
            label="Communes"
            info={communeArray.map((commune) => commune.nom).join(', ')}
          />
        )}
      </div>

      {extended && (
        <div
          className="grid w-full gap-2 fr-mt-2w"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}
        >
          <ResumeCard
            title="Surface totale"
            iconId="fr-icon-ruler-line"
            label="hectares"
            value={surface ?? 'N/A'}
            priority="secondary"
            size="sm"
          />
          <ResumeCard
            title="Captages actifs"
            iconId="fr-icon-drop-line"
            label="unités"
            value={nb_captages_actifs ?? 'N/A'}
            priority="secondary"
            size="sm"
          />
          <ResumeCard
            title="Parcelles agricoles"
            iconId="fr-icon-collage-line"
            label="unités"
            value={nb_parcelles ?? 'N/A'}
            priority="secondary"
            size="sm"
          />
          <ResumeCard
            title="Culture Bio"
            value={surface_agricole_bio?.surface?.toFixed(2) ?? 0}
            label="hectares"
            iconId="fr-icon-leaf-line"
            priority="secondary"
            size="sm"
          />
        </div>
      )}
    </SmallSection>
  )
}
