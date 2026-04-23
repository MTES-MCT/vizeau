import { useState } from 'react'

import { ExploitationJson, ParcelleJson } from '../../../types/models'

import { Tabs } from '@codegouvfr/react-dsfr/Tabs'
import ProjectLogEntries from './projet-log-entries'
import ProjetParcellesList from './projet-parcelles-list'
import ExploitationsList from '../exploitations/exploitations-list'
import ProjetInstallations from './projet-installations'

export type ProjetMainTabsProps = {
  parcelles: ParcelleJson[]
  exploitations: ExploitationJson[]
  installations: any[]
  etapes: any[] // TODO: Define the correct type for etapes
}

export default function ProjetMainTabs({
  parcelles,
  exploitations,
  installations,
  etapes,
}: ProjetMainTabsProps) {
  const [selectedTabId, setSelectedTabId] = useState('journal')

  const TABS = [
    {
      label: `Journal de bord`,
      tabId: 'journal',
    },
    {
      label: `Parcelles (${parcelles?.length ?? 0})`,
      tabId: 'parcelles',
      disabled: parcelles?.length === 0,
    },
    {
      label: `Exploitations (${exploitations?.length ?? 0})`,
      tabId: 'exploitations',
      disabled: exploitations?.length === 0,
    },
    {
      label: `Points de prélèvement (${installations?.length ?? 0})`,
      tabId: 'installations',
      disabled: installations?.length === 0,
    },
  ]
  console.log('installations', installations)
  return (
    <div>
      <Tabs
        selectedTabId={selectedTabId}
        tabs={TABS}
        onTabChange={(tab) => {
          setSelectedTabId(tab)
        }}
      >
        {selectedTabId === 'journal' && <ProjectLogEntries logEntries={etapes} />}
        {selectedTabId === 'parcelles' && <ProjetParcellesList parcelles={parcelles} />}
        {selectedTabId === 'exploitations' && <ExploitationsList exploitations={exploitations} />}
        {selectedTabId === 'installations' && <ProjetInstallations installations={installations} />}
      </Tabs>
    </div>
  )
}
