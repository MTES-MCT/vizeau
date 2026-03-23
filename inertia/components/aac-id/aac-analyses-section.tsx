import { useEffect, useMemo, useState } from 'react'
import { Table } from '@codegouvfr/react-dsfr/Table'
import { Tabs } from '@codegouvfr/react-dsfr/Tabs'
import { fr } from '@codegouvfr/react-dsfr'
import Loader from '../../ui/Loader/index.js'

type AnalyseRow = Record<string, unknown>

// Columns to hide from the table (internal identifiers already shown in context)
const HIDDEN_COLUMNS = new Set(['code_installation', 'cdinstallation', 'cddepartement'])

function formatColumnLabel(key: string): string {
  // Remove common French water-data prefixes, then humanise
  const cleaned = key
    .replace(/^(cd|lb|rs|lq|dt|nr)/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'number') return val.toLocaleString('fr-FR')
  return String(val)
}

type Props = {
  aacCode: string
  installationCode: string
  installationNom: string
}

export default function AacAnalysesSection({ aacCode, installationCode, installationNom }: Props) {
  const [years, setYears] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [analyses, setAnalyses] = useState<AnalyseRow[] | null>(null)
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch available years when the installation changes
  useEffect(() => {
    setLoadingYears(true)
    setError(null)
    setYears([])
    setSelectedYear('')
    setAnalyses(null)

    fetch(`/aac/${aacCode}/installations/${installationCode}/analyses/years`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<string[]>
      })
      .then((data) => {
        setYears(data)
        if (data.length > 0) setSelectedYear(data[0])
      })
      .catch(() => setError('Impossible de charger les analyses. Veuillez réessayer.'))
      .finally(() => setLoadingYears(false))
  }, [aacCode, installationCode])

  // Fetch analyses whenever the selected year changes
  useEffect(() => {
    if (!selectedYear) return

    setLoadingData(true)
    setAnalyses(null)

    fetch(`/aac/${aacCode}/installations/${installationCode}/analyses?year=${selectedYear}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<AnalyseRow[]>
      })
      .then(setAnalyses)
      .catch(() => setError('Impossible de charger les analyses. Veuillez réessayer.'))
      .finally(() => setLoadingData(false))
  }, [aacCode, installationCode, selectedYear])

  const visibleColumns = useMemo(() => {
    if (!analyses?.length) return []
    return Object.keys(analyses[0]).filter((k) => !HIDDEN_COLUMNS.has(k.toLowerCase()))
  }, [analyses])

  const tableRows = useMemo(() => {
    if (!analyses) return []
    return analyses.map((row) => visibleColumns.map((col) => formatCellValue(row[col])))
  }, [analyses, visibleColumns])

  const loading = loadingYears || loadingData

  return (
    <div
      className="fr-mt-1w fr-p-2w"
      style={{
        borderLeft: `3px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <p
        className="fr-text--sm fr-mb-1w"
        style={{ color: fr.colors.decisions.text.mention.grey.default }}
      >
        Analyses de qualité de l'eau — {installationNom}
      </p>

      {loading && (
        <div className="flex items-center gap-2 fr-py-2w">
          <Loader type="dots" size="sm" />
        </div>
      )}

      {error && (
        <div className="fr-alert fr-alert--error fr-alert--sm fr-my-1w">
          <p>{error}</p>
        </div>
      )}

      {!loadingYears && !error && years.length === 0 && (
        <p className="fr-text--sm fr-mb-0">Aucune analyse disponible pour ce point de captage.</p>
      )}

      {!loadingYears && !error && years.length > 0 && (
        <Tabs
          selectedTabId={selectedYear}
          onTabChange={setSelectedYear}
          tabs={years.map((year) => ({ tabId: year, label: year }))}
        >
          {loadingData && (
            <div className="flex items-center gap-2 fr-py-2w">
              <Loader type="dots" size="sm" />
            </div>
          )}
          {!loadingData && analyses !== null && analyses.length === 0 && (
            <p className="fr-text--sm fr-mb-0">Aucune analyse disponible pour cette année.</p>
          )}
          {!loadingData && analyses !== null && analyses.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <Table bordered headers={visibleColumns.map(formatColumnLabel)} data={tableRows} />
            </div>
          )}
        </Tabs>
      )}
    </div>
  )
}
