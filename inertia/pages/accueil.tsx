import { Head } from '@inertiajs/react'
import Layout from '~/ui/layouts/layout'

import type { ProjectJson } from '#types/models'
import Hero from '~/components/accueil/hero'

export type DashboardHomepageProps = {
  urgentTasksCount: number
  currentProjects: ProjectJson[]
}

export default function Accueil({ urgentTasksCount, currentProjects }: DashboardHomepageProps) {
  return (
    <Layout>
      <Head title="Accueil" />
      <Hero urgentTasksCount={urgentTasksCount} currentProjectsCount={currentProjects.length} />
    </Layout>
  )
}
