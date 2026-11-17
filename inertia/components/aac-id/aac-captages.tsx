import { useEffect, useMemo, useRef, useState } from 'react'
import type { AacAnalysesSummaryJson, InstallationInfo } from '#types/aac'

import Badge from '@codegouvfr/react-dsfr/Badge'
import Button from '@codegouvfr/react-dsfr/Button'
import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import Tooltip from '@codegouvfr/react-dsfr/Tooltip'
import { Range } from '@codegouvfr/react-dsfr/Range'
import ButtonWithSelector, { OptionType } from '~/ui/ButtonWithSelector'
import Tag from '@codegouvfr/react-dsfr/Tag'
import SmallSection from '~/ui/SmallSection'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { fr } from '@codegouvfr/react-dsfr'
import ResumeCard from '~/ui/ResumeCard'
import Loader from '~/ui/Loader'
import DepassementsListItem from '~/ui/DepassementsListItem'
import {
  formatCaptageCommune,
  getEtatSeverity,
  getInstallationTags,
  isInstallationAPart,
} from '~/functions/aac'

type AnalysesSummary = {
  nb_analyses: number
  nb_parametres: number
  yearMin: number | null
  yearMax: number | null
}

type Installation = Pick<
  InstallationInfo,
  | 'code'
  | 'nom'
  | 'code_bss'
  | 'code_bss_nouveau'
  | 'commune'
  | 'departement'
  | 'type'
  | 'etat'
  | 'prioritaire'
  | 'captages_rattaches'
  | 'source_rattachement'
  | 'recroisement_geographique'
  | 'a_part'
  | 'motif_a_part'
  | 'libelle_a_part'
  | 'depassements_alerte'
  | 'depassements_reglementaires'
>

export type AacCaptagesProps = {
  aacCode: string
  installations: Installation[]
}

// Recherche par nom ou code, `query` étant déjà en minuscules
function matchesSearch(captage: { nom: string; code: string }, query: string): boolean {
  return captage.nom.toLowerCase().includes(query) || captage.code.toLowerCase().includes(query)
}

/**
 * Mention des captages rattachés à une installation (même code BSS dans le Sandre) : leur
 * nombre seulement, le détail étant sur la fiche de l'installation. Pendant une recherche, on
 * nomme ceux qui correspondent, pour expliquer pourquoi l'installation est remontée.
 */
function getCaptagesRattachesLabel(
  captages: NonNullable<Installation['captages_rattaches']>,
  query: string
): string {
  const count = `${captages.length} point${captages.length > 1 ? 's' : ''} de prélèvement rattaché${captages.length > 1 ? 's' : ''}`
  const matching = query === '' ? [] : captages.filter((captage) => matchesSearch(captage, query))
  if (matching.length === 0) {
    return count
  }

  return `${count}, dont ${matching.map((captage) => captage.nom).join(', ')}`
}

function InstallationListItem({
  aacCode,
  installation,
  priority,
  query,
}: {
  aacCode: string
  installation: Installation
  priority: 'primary' | 'secondary'
  // Recherche en cours, en minuscules
  query: string
}) {
  const aPart = isInstallationAPart(installation)
  // Un captage à part n'est pas compté, ni présenté comme prioritaire : il ne l'est que par
  // défaut, quand la liste nationale ne lui donne aucune AAC valide
  const prioritaire = installation.prioritaire === true && !aPart
  const captagesRattaches = installation.captages_rattaches ?? []

  return (
    <DepassementsListItem
      title={installation.nom}
      priority={priority}
      linkProps={
        installation.code
          ? { href: `/aac/${aacCode}/installations/${installation.code}` }
          : undefined
      }
      additionalInfos={{
        ...(prioritaire && {
          message: 'Prioritaire',
          iconId: 'fr-icon-info-fill',
        }),
        ...(installation.etat && {
          alert: { text: installation.etat, severity: getEtatSeverity(installation.etat) },
        }),
      }}
      tags={getInstallationTags(installation)}
      depassementsAlerte={installation.depassements_alerte}
      depassementsReglementaires={installation.depassements_reglementaires}
      metas={[
        {
          iconId: 'fr-icon-government-line',
          content: formatCaptageCommune(installation.commune, installation.departement),
        },
        ...(captagesRattaches.length > 0
          ? [
              {
                iconId: 'fr-icon-links-line',
                content: getCaptagesRattachesLabel(captagesRattaches, query),
              },
            ]
          : []),
      ]}
    />
  )
}

export default function AacCaptages({ aacCode, installations }: AacCaptagesProps) {
  const [showActifOnly, setShowActifOnly] = useState(false)
  const [deselectedTypes, setDeselectedTypes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [analysesSummary, setAnalysesSummary] = useState<AnalysesSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSummary = (from?: number, to?: number) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    setLoadingSummary(true)
    const params = new URLSearchParams()
    if (from !== undefined) params.set('yearFrom', String(from))
    if (to !== undefined) params.set('yearTo', String(to))
    const qs = params.size > 0 ? `?${params}` : ''
    fetch(`/aac/${aacCode}/analyses/summary${qs}`, { signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AacAnalysesSummaryJson | null) => {
        if (!data) return
        setAnalysesSummary((prevSummary) => {
          const yearMin = data.yearMin === undefined ? (prevSummary?.yearMin ?? null) : data.yearMin
          const yearMax = data.yearMax === undefined ? (prevSummary?.yearMax ?? null) : data.yearMax

          // Initialize slider bounds on first load
          setYearFrom((prev) => {
            if (yearMin === null) return null
            return prev ?? yearMin
          })
          setYearTo((prev) => {
            if (yearMax === null) return null
            return prev ?? yearMax
          })

          return {
            ...data,
            yearMin,
            yearMax,
          }
        })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err)
      })
      .finally(() => {
        if (!signal.aborted) setLoadingSummary(false)
      })
  }

  useEffect(() => {
    fetchSummary()
    return () => {
      if (abortRef.current) abortRef.current.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = null
      abortRef.current = null
    }
  }, [aacCode])

  const handleYearFromChange = (value: number) => {
    setYearFrom(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSummary(value, yearTo ?? undefined), 400)
  }

  const handleYearToChange = (value: number) => {
    setYearTo(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSummary(yearFrom ?? undefined, value), 400)
  }

  const selectInputOptions = useMemo(() => {
    const types = Array.from(new Set(installations.map((inst) => inst.type)))
    return types.map((type) => ({
      value: type,
      label: type,
      isSelected: !deselectedTypes.has(type),
    }))
  }, [installations, deselectedTypes])

  // Liste principale, et installations à part (abandonnées, ou hors eau potable), affichées
  // dans une section distincte et exclues des statistiques
  const installationsPrincipales = useMemo(
    () => installations.filter((installation) => !isInstallationAPart(installation)),
    [installations]
  )
  const installationsAPart = useMemo(
    () => installations.filter((installation) => isInstallationAPart(installation)),
    [installations]
  )

  // Les filtres s'appliquent aux deux listes. La recherche porte aussi sur les captages
  // rattachés, pour qu'un captage rangé dans une installation soit trouvé par son nom.
  const query = searchQuery.toLowerCase()
  const matchesFilters = useMemo(() => {
    const selectedTypes = new Set(
      selectInputOptions.filter((o) => o.isSelected).map((o) => o.value)
    )
    return (installation: Installation) =>
      (!showActifOnly || installation.etat === 'ACTIF') &&
      selectedTypes.has(installation.type) &&
      (query === '' ||
        matchesSearch(installation, query) ||
        (installation.captages_rattaches ?? []).some((captage) => matchesSearch(captage, query)))
  }, [showActifOnly, selectInputOptions, query])

  const filteredInstallations = installationsPrincipales.filter(matchesFilters)
  const filteredInstallationsAPart = installationsAPart.filter(matchesFilters)

  const handleOptionChange = (updatedOption: OptionType<string>) => {
    setDeselectedTypes((prev) => {
      const next = new Set(prev)
      if (updatedOption.isSelected) {
        next.delete(updatedOption.value)
      } else {
        next.add(updatedOption.value)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="fr-p-3w flex flex-col gap-2"
        style={{
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        }}
      >
        <div>
          <p className="fr-text--bold fr-mb-0">Données par périodes</p>
          <p
            className="fr-text--sm fr-mb-2w"
            style={{ color: fr.colors.decisions.text.mention.grey.default }}
          >
            Sélectionner une période pour consulter l'évolution des données
          </p>
        </div>

        {loadingSummary && !analysesSummary ? (
          <div className="flex items-center justify-center fr-py-2w">
            <Loader type="dots" size="sm" />
          </div>
        ) : (
          analysesSummary &&
          analysesSummary.yearMin !== null &&
          analysesSummary.yearMax !== null &&
          analysesSummary.yearMin <= analysesSummary.yearMax &&
          yearFrom !== null &&
          yearTo !== null && (
            <div className="relative">
              <Range
                double
                small
                label=""
                min={analysesSummary.yearMin}
                max={analysesSummary.yearMax}
                nativeInputProps={[
                  {
                    'value': yearFrom,
                    'onChange': (e) => handleYearFromChange(Number(e.target.value)),
                    'aria-label': 'Année de début de la période',
                    'disabled': loadingSummary,
                  },
                  {
                    'value': yearTo,
                    'onChange': (e) => handleYearToChange(Number(e.target.value)),
                    'aria-label': 'Année de fin de la période',
                    'disabled': loadingSummary,
                  },
                ]}
              />
              {loadingSummary && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader type="dots" size="sm" />
                </div>
              )}
            </div>
          )
        )}
      </div>

      <div
        className="flex flex-col gap-3 fr-p-3w"
        style={{ border: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}
      >
        <div className="grid grid-cols-3 gap-3">
          <ResumeCard
            title="Points de prélèvement"
            iconId="fr-icon-drop-line"
            value={installationsPrincipales.filter((i) => i.etat === 'ACTIF').length}
            label="points de prélèvement actifs"
            priority="secondary"
          />
          <ResumeCard
            title="Analyses effectuées"
            iconId="fr-icon-microscope-line"
            value={analysesSummary?.nb_analyses ?? '—'}
            label="analyses"
            priority="secondary"
            loading={loadingSummary}
          />
          <ResumeCard
            title="Paramètres analysés"
            iconId="fr-icon-test-tube-line"
            value={analysesSummary?.nb_parametres ?? '—'}
            label="paramètres"
            priority="secondary"
            loading={loadingSummary}
          />
        </div>

        <ResumeCard
          title="Prioritaire(s)"
          iconId="fr-icon-warning-line"
          value={installationsPrincipales.filter((i) => i.prioritaire === true).length}
          label="point(s) de prélèvement"
          priority="secondary"
          color={fr.colors.decisions.text.default.warning.default}
        />

        <h2 className="fr-h4 fr-mb-1w fr-mt-2w">Visualisation des points de prélèvement</h2>

        <div className="flex gap-2 items-stretch">
          <div
            className="flex flex-1 items-stretch"
            style={{
              border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            }}
          >
            <input
              className="fr-input"
              type="search"
              placeholder="Rechercher un point de prélèvement"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', boxShadow: 'none', flex: 1, outline: 'none' }}
              aria-label="Rechercher une AAC"
            />
            <Button iconId="fr-icon-search-line" title="Rechercher" priority="primary" />
          </div>
          <Button
            iconId="fr-icon-filter-line"
            title={showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            priority={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
          />
        </div>

        {showFilters && (
          <SmallSection title="Filtres" iconId="fr-icon-filter-line" hasBorder priority="secondary">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <ButtonWithSelector
                  label="Filtrer par type"
                  options={selectInputOptions}
                  onOptionChange={handleOptionChange}
                />
                <ul className="flex gap-1 fr-p-0 fr-m-0">
                  {selectInputOptions
                    .filter((o) => o.isSelected)
                    .map((option) => (
                      <li key={option.value} style={{ listStyle: 'none' }}>
                        <Tag
                          key={option.value}
                          small
                          dismissible
                          nativeButtonProps={{
                            onClick: () => handleOptionChange({ ...option, isSelected: false }),
                          }}
                        >
                          {option.label}
                        </Tag>
                      </li>
                    ))}
                </ul>
              </div>
              <Checkbox
                small
                options={[
                  {
                    label: 'Afficher uniquement les points de prélèvement actifs',
                    nativeInputProps: {
                      name: 'showActifOnly',
                      value: showActifOnly.toString(),
                      onChange: (e) => setShowActifOnly(e.target.checked),
                      checked: showActifOnly,
                    },
                  },
                ]}
              />
            </div>
          </SmallSection>
        )}

        {filteredInstallations.length > 0 ? (
          <ul className="flex flex-col gap-2 fr-p-0">
            {filteredInstallations.map((installation, index) => (
              <li key={installation.code} style={{ listStyle: 'none' }}>
                <InstallationListItem
                  aacCode={aacCode}
                  installation={installation}
                  priority={index % 2 === 1 ? 'secondary' : 'primary'}
                  query={query}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyPlaceholder
            label={
              installationsPrincipales.length > 0
                ? 'Aucun point de prélèvement ne correspond à ces critères'
                : installationsAPart.length > 0
                  ? "Aucun point de prélèvement d'eau potable en service n'est rattaché à l'AAC : ses points de prélèvement sont listés ci-dessous, dans « Autres points de prélèvement dans l'AAC »"
                  : 'Aucun point de prélèvement trouvé'
            }
            illustrativeIcon="fr-icon-drop-fill"
          />
        )}

        {installationsAPart.length > 0 && (
          <section className="flex flex-col gap-2 fr-mt-2w">
            <div>
              <h3 className="fr-h5 fr-mb-1v">Autres points de prélèvement dans l'AAC</h3>
              <p
                className="fr-text--sm fr-mb-0"
                style={{ color: fr.colors.decisions.text.mention.grey.default }}
              >
                Points de prélèvement situés dans l'AAC, mais abandonnés pour l'eau potable ou qui
                servent à un autre usage. Ils ne sont pas comptés dans les statistiques ci-dessus.
              </p>
            </div>
            {filteredInstallationsAPart.length > 0 ? (
              <ul className="flex flex-col gap-2 fr-p-0">
                {filteredInstallationsAPart.map((installation, index) => (
                  <li key={installation.code} style={{ listStyle: 'none' }}>
                    <InstallationListItem
                      aacCode={aacCode}
                      installation={installation}
                      priority={index % 2 === 1 ? 'secondary' : 'primary'}
                      query={query}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyPlaceholder
                label="Aucun autre point de prélèvement ne correspond à ces critères"
                illustrativeIcon="fr-icon-drop-fill"
              />
            )}
          </section>
        )}
      </div>
    </div>
  )
}
