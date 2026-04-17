import { useEffect, useMemo, useRef, useState } from 'react'
import { stringToColor } from '~/functions/colors'

import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import { Range } from '@codegouvfr/react-dsfr/Range'
import ButtonWithSelector, { OptionType } from '~/ui/ButtonWithSelector'
import Tag from '@codegouvfr/react-dsfr/Tag'
import SmallSection from '~/ui/SmallSection'
import ListItem from '~/ui/ListItem'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import AacAnalysesSection from '~/components/aac-id/aac-analyses-section'
import { fr } from '@codegouvfr/react-dsfr'
import ResumeCard from '~/ui/ResumeCard'

type AnalysesSummary = {
  nb_analyses: number
  nb_parametres: number
  conforme: number
  alerte: number
  non_conforme: number
  yearMin: number
  yearMax: number
}

export type AacCaptagesProps = {
  aacCode: string
  installations: {
    code: string
    nom: string
    code_bss: string
    commune: string
    departement: string
    type: string
    nature: string
    usage: string
    etat: string
    prioritaire: boolean | null
  }[]
}

export default function AacCaptages({ aacCode, installations }: AacCaptagesProps) {
  const [filteredInstallations, setFilteredInstallations] = useState(installations)
  const [showActifOnly, setShowActifOnly] = useState(false)
  const [selectedInstallationCode, setSelectedInstallationCode] = useState<string | null>(null)
  const [deselectedTypes, setDeselectedTypes] = useState<Set<string>>(new Set())
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
      .then((data: AnalysesSummary | null) => {
        if (!data) return
        setAnalysesSummary(data)
        // Initialize slider bounds on first load
        setYearFrom((prev) => prev ?? data.yearMin)
        setYearTo((prev) => prev ?? data.yearMax)
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
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
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
  useEffect(() => {
    const selectedTypes = new Set(
      selectInputOptions.filter((o) => o.isSelected).map((o) => o.value)
    )
    setFilteredInstallations(
      installations.filter(
        (installation) =>
          (!showActifOnly || installation.etat === 'ACTIF') && selectedTypes.has(installation.type)
      )
    )
  }, [showActifOnly, installations, selectInputOptions])

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

  const toggleInstallation = (code: string) => {
    setSelectedInstallationCode((prev) => (prev === code ? null : code))
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

        {analysesSummary && yearFrom !== null && yearTo !== null && (
          <Range
            double
            small
            label=""
            min={analysesSummary.yearMin}
            max={analysesSummary.yearMax}
            nativeInputProps={[
              { value: yearFrom, onChange: (e) => handleYearFromChange(Number(e.target.value)) },
              { value: yearTo, onChange: (e) => handleYearToChange(Number(e.target.value)) },
            ]}
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ResumeCard
          title="Points de prélèvement"
          iconId="fr-icon-drop-line"
          value={installations.length}
          label="points de prélèvement"
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
          iconId="fr-icon-bar-chart-box-line"
          value={analysesSummary?.nb_parametres ?? '—'}
          label="paramètres"
          priority="secondary"
          loading={loadingSummary}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ResumeCard
          title="Conformes"
          iconId="fr-icon-checkbox-circle-line"
          value={analysesSummary?.conforme ?? '—'}
          label="analyses"
          priority="secondary"
          color={fr.colors.decisions.text.default.success.default}
          loading={loadingSummary}
        />
        <ResumeCard
          title="En alerte"
          iconId="fr-icon-alert-line"
          value={analysesSummary?.alerte ?? '—'}
          label="sans données bactério ni chimique"
          priority="secondary"
          color={fr.colors.decisions.text.default.warning.default}
          loading={loadingSummary}
        />
        <ResumeCard
          title="Non-conformes"
          iconId="fr-icon-close-circle-line"
          value={analysesSummary?.non_conforme ?? '—'}
          label="analyses"
          priority="secondary"
          color={fr.colors.decisions.text.default.error.default}
          loading={loadingSummary}
        />
      </div>

      <SmallSection title="Filtres" iconId="fr-icon-filter-line" hasBorder>
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

      {filteredInstallations && filteredInstallations.length > 0 ? (
        <ul className="flex flex-col gap-2 fr-p-0">
          {filteredInstallations.map((installation, index) => {
            const isSelected = selectedInstallationCode === installation.code
            return (
              <li key={installation.code} style={{ listStyle: 'none' }}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isSelected}
                  className="cursor-pointer"
                  style={{
                    outline: isSelected
                      ? `2px solid ${fr.colors.decisions.border.default.blueFrance.default}`
                      : undefined,
                  }}
                  onClick={() => toggleInstallation(installation.code)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleInstallation(installation.code)
                    }
                  }}
                >
                  <ListItem
                    additionalInfos={{
                      ...(installation.prioritaire === true && {
                        message: 'Prioritaire',
                        iconId: 'fr-icon-info-fill',
                      }),
                      ...(installation.etat && {
                        alert: {
                          text: installation.etat,
                          severity: installation.etat === 'ACTIF' ? 'success' : 'error',
                        },
                      }),
                    }}
                    variant="compact"
                    hasBorder
                    priority={index % 2 === 1 ? 'secondary' : 'primary'}
                    title={
                      <span className="flex items-center gap-1">
                        {installation.nom}
                        <span
                          className={
                            isSelected ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'
                          }
                          aria-hidden="true"
                          style={{
                            color: fr.colors.decisions.text.label.blueFrance.default,
                            fontSize: '0.875rem',
                          }}
                        />
                      </span>
                    }
                    tags={[
                      {
                        label: installation.type,
                        color: stringToColor(installation.type),
                      },
                    ]}
                    metas={[
                      {
                        iconId: 'fr-icon-government-line',
                        content: `${installation.commune} (${installation.departement})`,
                      },
                    ]}
                  />
                </div>

                {isSelected && (
                  <AacAnalysesSection
                    aacCode={aacCode}
                    installationCode={installation.code}
                    installationNom={installation.nom}
                  />
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyPlaceholder
          label={`${installations.length > 0 ? 'Aucun point de prélèvement ne correspond à ces critères' : 'Aucun point de prélèvement trouvé'}`}
          illustrativeIcon="fr-icon-drop-fill"
        />
      )}
    </div>
  )
}
