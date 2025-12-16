import { ChangeEvent, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { debounce } from 'lodash-es'
import VisualisationMap from '~/components/map/VisualisationMap'
import Layout from '~/ui/layouts/layout'
import MapLayout from '~/ui/layouts/MapLayout'
import VisualisationLeftSideBar from '~/components/visualisation-left-side-bar'
import VisualisationController from '#controllers/visualisation_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import { ExploitationJson } from '../../types/models'
import VisualisationRightSide from '~/components/visualisation-right-side-bar'

const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
  router.reload({
    only: ['exploitations'],
    data: { recherche: e.target.value },
    replace: true,
  })
}, 300)

export default function VisualisationPage({
  exploitations,
  queryString,
  pmtilesUrl,
}: InferPageProps<VisualisationController, 'index'>) {
  const filteredExploitation = exploitations
  const [selectedExploitation, setSelectedExploitation] = useState<ExploitationJson | undefined>(
    undefined
  )

  return (
    <Layout isMapLayout={true} hideFooter={true}>
      <Head title="Visualisation" />
      <MapLayout
        pageName="Exploitations"
        leftContent={
          <VisualisationLeftSideBar
            exploitations={filteredExploitation}
            handleSearch={handleSearch}
            queryString={queryString}
            selectedExploitation={selectedExploitation}
            setSelectedExploitation={setSelectedExploitation}
          />
        }
        map={
          <VisualisationMap
            exploitations={filteredExploitation}
            exploitation={selectedExploitation}
            setExploitation={setSelectedExploitation}
            pmtilesUrl={pmtilesUrl || ''}
          />
        }
        rightContent={<VisualisationRightSide />}
      />
    </Layout>
  )
}
