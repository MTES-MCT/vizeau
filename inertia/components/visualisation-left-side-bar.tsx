import { ChangeEvent } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import ListItem from '~/ui/ListItem'
import { ExploitationJson } from '../../types/models'
import SearchBar from '@codegouvfr/react-dsfr/SearchBar'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import Button from '@codegouvfr/react-dsfr/Button'
import VisualisationExploitationInfos from './visualisation-exploitation-infos'
import AnalysesSection from './analyses-section'

export default function VisualisationLeftSideBar({
  exploitations,
  queryString,
  handleSearch,
  selectedExploitation,
  setSelectedExploitationId,
  isMapLoading,
  editMode,
}: {
  exploitations: ExploitationJson[]
  queryString?: { recherche?: string }
  handleSearch: (e: ChangeEvent<HTMLInputElement>) => void
  selectedExploitation?: ExploitationJson
  setSelectedExploitationId: (exploitationId: string | undefined) => void
  isMapLoading: boolean
  editMode: boolean
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
          <div
            className="fr-p-1w fr-m-1w"
            style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}
          >
            <div className="flex justify-between items-center fr-mb-3w">
              <h4 className="fr-m-0 font-bold fr-text--lead">{selectedExploitation?.name}</h4>
              <div>
                <Button
                  linkProps={{ href: `/exploitations/${selectedExploitation.id}` }}
                  priority="secondary"
                  iconId="fr-icon-arrow-right-line"
                >
                  Voir
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <VisualisationExploitationInfos exploitation={selectedExploitation} />
              <AnalysesSection parcelles={[]} />
              {/* Renvoie un tableau vide le temps de disposer de cette information */}
            </div>
          </div>
        </div>
      ) : (
        <div className="fr-p-1w">
          <div className="flex">
            <SearchBar
              className="flex flex-1 fr-mb-2w"
              renderInput={({ className, id, placeholder, type }) => (
                <input
                  className={className}
                  id={id}
                  placeholder={placeholder}
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
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
