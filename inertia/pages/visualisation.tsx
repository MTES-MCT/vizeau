import { ChangeEvent, useState } from 'react'
import { router } from '@inertiajs/react'
import { debounce } from 'lodash-es'
import VisualisationMap from '~/components/map/VisualisationMap'
import Layout from '~/ui/layouts/layout'
import MapLayout from '~/ui/layouts/MapLayout'
import VisualisationLeftSideBar from '~/components/visualisation-left-side-bar'
import VisualisationController from '#controllers/visualisation_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import { ExploitationJson } from '../../types/models'

const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
  router.reload({
    only: ['exploitationsWithPagination'],
    data: { recherche: e.target.value },
    replace: true,
  })
}, 300)

export default function VisualisationPage({
  exploitationsWithPagination,
  queryString,
}: InferPageProps<VisualisationController, 'index'>) {
  const { data: exploitations } = exploitationsWithPagination
  const [selectedExploitation, setSelectedExploitation] = useState<ExploitationJson | undefined>(undefined)

  return (
    <Layout isMapLayout={true} hideFooter={true}>
      <MapLayout
        pageName="Exploitations"
        leftContent={
          <VisualisationLeftSideBar
            exploitations={exploitations}
            handleSearch={handleSearch}
            queryString={queryString}
            selectedExploitation={selectedExploitation}
            setSelectedExploitation={setSelectedExploitation}
          />
        }
        map={
          <VisualisationMap
            exploitations={exploitations}
            exploitation={selectedExploitation}
            setExploitation={setSelectedExploitation}
          />
        }
      />
    </Layout>
  )
}
