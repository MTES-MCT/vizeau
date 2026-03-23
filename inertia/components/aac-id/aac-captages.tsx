import { useEffect, useMemo, useState } from 'react'
import { stringToColor } from '~/functions/colors'

import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import ButtonWithSelector, { OptionType } from '~/ui/ButtonWithSelector'
import Tag from '@codegouvfr/react-dsfr/Tag'
import SmallSection from '~/ui/SmallSection'
import ListItem from '~/ui/ListItem'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import AacAnalysesSection from '~/components/aac-id/aac-analyses-section'
import { fr } from '@codegouvfr/react-dsfr'

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
                label: 'Afficher uniquement les points de captage actifs',
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
          label={`${installations.length > 0 ? 'Aucun point de captage ne correspond à ces critères' : 'Aucun point de captage trouvé'}`}
          illustrativeIcon="fr-icon-drop-fill"
        />
      )}
    </div>
  )
}
