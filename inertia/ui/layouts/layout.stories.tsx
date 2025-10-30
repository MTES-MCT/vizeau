import { ReactNode } from 'react'
import { JSX } from 'react/jsx-runtime'
import Layout from './layout'

export default {
  title: 'ui/layouts/Layout',
  component: Layout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    hideFooter: { control: 'boolean' },
  },
}

export const Default = {
  render: (
    args: JSX.IntrinsicAttributes & { hideFooter?: boolean } & { children?: ReactNode | undefined }
  ) => (
    <Layout {...args}>
      <div className="fr-container fr-mt-5w">
        <h1>Contenu de la page</h1>
        <p>Ceci est un exemple de contenu à l'intérieur du layout.</p>
      </div>
    </Layout>
  ),
}

export const WithoutFooter = {
  args: {
    hideFooter: true,
  },
  render: (
    args: JSX.IntrinsicAttributes & { hideFooter?: boolean } & { children?: ReactNode | undefined }
  ) => (
    <Layout {...args}>
      <div className="fr-container fr-mt-5w">
        <h1>Contenu de la page sans pied de page</h1>
        <p>Ceci est un exemple de contenu à l'intérieur du layout sans pied de page.</p>
      </div>
    </Layout>
  ),
}
