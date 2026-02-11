import { ChangeEvent, RefObject } from 'react'
import { Link } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import ListItem from '~/ui/ListItem'
import { ExploitationJson } from '../../types/models'
import SearchBar from '@codegouvfr/react-dsfr/SearchBar'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import Button from '@codegouvfr/react-dsfr/Button'
import VisualisationExploitationInfos from './visualisation-exploitation-infos'
import AnalysesSection from './analyses-section'
import { VisualisationMapRef } from '~/components/map/VisualisationMap'
import Alert from '@codegouvfr/react-dsfr/Alert'
import ParcellesSection from './parcelle/parcelles-section'

export default function VisualisationLeftSideBar({
  exploitations,
  queryString,
  handleSearch,
  selectedExploitation,
  setSelectedExploitationId,
  isMapLoading,
  editMode,
  mapRef,
}: {
  exploitations: ExploitationJson[]
  queryString?: { recherche?: string }
  handleSearch: (e: ChangeEvent<HTMLInputElement>) => void
  selectedExploitation?: ExploitationJson
  setSelectedExploitationId: (exploitationId: string | undefined) => void
  isMapLoading: boolean
  editMode: boolean
  mapRef: RefObject<VisualisationMapRef>
}) {
  return (
    <div>
      {selectedExploitation ? (
        <div className="fr-p-1w">
          <Breadcrumb
            currentPageLabel={selectedExploitation?.name}
            segments={[
              {
                label: 'Liste des exploitations agricoles',
                linkProps: {
                  href: '#',
                  onClick: () => {
                    // Only allow going back to the list if not in edit mode
                    if (!editMode) {
                      setSelectedExploitationId(undefined)
                    }
                  },
                  style: {
                    cursor: !editMode ? 'pointer' : 'not-allowed',
                    // href "#" transforms the link into a button with blue text, we override it to look like a normal link
                    fontSize: 'inherit',
                    color: 'inherit',
                  },
                },
              },
            ]}
            style={{ marginBottom: fr.spacing('2v') }}
            className="fr-m-1w"
          />
          {selectedExploitation.isDemo && (
            <Alert
              severity="warning"
              title="Exploitation de test"
              description="Cette exploitation a été créée par l'administrateur du système à des fins de démonstration. Les parcelles associées ici seront visibles des autres testeurs."
              className="fr-mb-4w"
            />
          )}
          <div
            className="fr-p-1w fr-m-1w"
            style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}
          >
            <div className="flex flex-col gap-4 fr-mb-1v">
              <Link
                href={`/exploitations/${selectedExploitation.id}`}
                as="h4"
                className="fr-m-0 font-bold fr-text--lead underline cursor-pointer"
              >
                {selectedExploitation?.name}
              </Link>
              <Button
                priority="secondary"
                size="small"
                iconId="fr-icon-crosshair-2-line"
                className="flex justify-center"
                onClick={() => {
                  if (selectedExploitation) {
                    mapRef.current?.centerOnExploitation(selectedExploitation)
                  }
                }}
                style={{ whiteSpace: 'nowrap', width: '100%' }}
              >
                Centrer sur l'exploitation
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              <VisualisationExploitationInfos exploitation={selectedExploitation} />
                {/* Renvoie un tableau vide le temps de disposer de cette information */}
              <AnalysesSection parcelles={[]} />
              <ParcellesSection
                parcelles={selectedExploitation.parcelles ?? []}
                exploitationId={selectedExploitation.id}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="fr-p-1w">
          <div className="flex">
            <SearchBar
              className="flex flex-1 fr-mb-2w"
              renderInput={({ className, id, type }) => (
                <input
                  className={className}
                  id={id}
                  placeholder="Rechercher une exploitation agricole"
                  type={type}
                  onChange={handleSearch}
                  defaultValue={queryString?.recherche || ''}
                />
              )}
            />
          </div>
          {exploitations.map((exploitation, index) => (
            <div
              onClick={() => {
                if (!isMapLoading) {
                  setSelectedExploitationId(exploitation.id)
                  mapRef.current?.centerOnExploitation(exploitation)
                }
              }}
              style={{ cursor: !isMapLoading ? 'pointer' : 'progress' }}
              key={exploitation.id}
            >
              <ListItem
                title={
                  <div>
                    <span
                      className={
                        exploitation?.siret
                          ? 'fr-icon-building-line fr-pr-1w'
                          : 'fr-icon-user-line fr-pr-1w'
                      }
                      style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
                      aria-hidden="true"
                    />
                    {exploitation.name}
                  </div>
                }
                subtitle={exploitation?.commune || 'N/A'}
                priority={index % 2 === 0 ? 'primary' : 'secondary'}
                tags={exploitation.tags?.map((tag) => ({ label: tag.name }))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
