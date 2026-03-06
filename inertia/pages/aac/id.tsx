import { Head } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import { Badge } from '@codegouvfr/react-dsfr/Badge'
import { InferPageProps } from '@adonisjs/inertia/types'
import Layout from '~/ui/layouts/layout'
import AacController from '#controllers/aac_controller'

type AacData = InferPageProps<AacController, 'show'>['aac']
type CultureInfo = AacData['surface_agricole_utile'][string]

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-200 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="fr-h6 fr-mb-2w fr-mt-4w">{children}</h3>
}

function CulturesTable({ data, title }: { data: Record<string, CultureInfo>; title: string }) {
  const rows = Object.entries(data).filter(([, v]) => v !== null && v?.surface != null)
  if (rows.length === 0) return null

  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <div className="fr-table fr-table--bordered">
        <table>
          <thead>
            <tr>
              <th>Culture</th>
              <th>Nb parcelles</th>
              <th>Surface (ha)</th>
              <th>SAU (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([culture, info]) => (
              <tr key={culture}>
                <td>{culture}</td>
                <td>{info?.nb_parcelles ?? '—'}</td>
                <td>{info?.surface?.toFixed(2) ?? '—'}</td>
                <td>{info?.SAU ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function AacShow({ aac }: InferPageProps<AacController, 'show'>) {
  const communeEntries = Object.entries(aac.communes?.communes ?? {})
  const analyseYears = aac.nb_analyses ?? []

  return (
    <Layout>
      <Head title={`${aac.nom} — AAC`} />

      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container">
          <div className="fr-h6 fr-mb-0">{aac.nom}</div>
          <p className="fr-text--sm fr-mb-0 text-gray-600">Code : {aac.code}</p>
        </div>
      </div>

      <div className="fr-container fr-mt-4w fr-mb-8w">
        <SectionTitle>Informations générales</SectionTitle>
        <div className="fr-card fr-card--no-arrow fr-p-3w">
          <InfoRow label="Surface totale" value={`${aac.surface?.toLocaleString('fr-FR')} ha`} />
          <InfoRow
            label="Surface agricole"
            value={`${aac.surface_agricole?.toLocaleString('fr-FR')} ha`}
          />
          <InfoRow label="Captages actifs" value={aac.nb_captages_actifs} />
          <InfoRow label="Installations" value={aac.nb_installations} />
          <InfoRow label="Parcelles" value={aac.nb_parcelles} />
          <InfoRow label="Date de création" value={aac.date_creation} />
          <InfoRow label="Dernière mise à jour" value={aac.date_maj} />
        </div>

        {aac.surface_agricole_bio && (
          <>
            <SectionTitle>Agriculture biologique</SectionTitle>
            <div className="fr-card fr-card--no-arrow fr-p-3w">
              <InfoRow
                label="Surface bio"
                value={`${aac.surface_agricole_bio.surface?.toLocaleString('fr-FR')} ha`}
              />
              <InfoRow label="Nb parcelles bio" value={aac.surface_agricole_bio.nb_parcelles} />
              <InfoRow label="Part bio" value={`${aac.surface_agricole_bio.part_bio} %`} />
            </div>
          </>
        )}

        {analyseYears.length > 0 && (
          <>
            <SectionTitle>Nombre d'analyses par année</SectionTitle>
            <div className="flex flex-wrap gap-3">
              {analyseYears.map(({ year, count }) => (
                <div
                  key={year}
                  className="fr-card fr-card--no-arrow fr-p-2w text-center min-w-[80px]"
                >
                  <div className="text-xs text-gray-500">{year}</div>
                  <div className="fr-h5 fr-mb-0">{count}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {communeEntries.length > 0 && (
          <>
            <SectionTitle>Communes ({aac.communes?.nb_communes})</SectionTitle>
            <div className="fr-table fr-table--bordered">
              <table>
                <thead>
                  <tr>
                    <th>Commune</th>
                    <th>Code INSEE</th>
                    <th>Surface (ha)</th>
                    <th>Répartition (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {communeEntries
                    .sort(([, a], [, b]) => (b?.repartition ?? 0) - (a?.repartition ?? 0))
                    .map(([nom, info]) => (
                      <tr key={nom}>
                        <td>{nom}</td>
                        <td>
                          <Badge severity="info" small>
                            {info?.code_insee}
                          </Badge>
                        </td>
                        <td>{info?.surface?.toLocaleString('fr-FR')}</td>
                        <td>{info?.repartition} %</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <CulturesTable
          data={aac.surface_agricole_utile ?? {}}
          title="Surface agricole utile (SAU totale)"
        />
        <CulturesTable
          data={aac.surface_agricole_ppe ?? {}}
          title="SAU en périmètre de protection éloigné (PPE)"
        />
        <CulturesTable
          data={aac.surface_agricole_ppr ?? {}}
          title="SAU en périmètre de protection rapproché (PPR)"
        />
      </div>
    </Layout>
  )
}
