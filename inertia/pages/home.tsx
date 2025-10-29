import { Box } from '@mui/material'
import { Head } from '@inertiajs/react'
import Layout from './layout'

export default function Home() {
  return (
    <Layout>
      <Head title="Accueil" />
      <Box component="div" className="fr-container"></Box>
    </Layout>
  )
}
