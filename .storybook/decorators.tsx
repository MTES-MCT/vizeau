import React from 'react'
import type { Decorator } from '@storybook/react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { createTuyau } from '@tuyau/core/client'
import { registry } from '../.adonisjs/client/registry/index.js'

// Context pour simuler usePage d'Inertia
const InertiaPageContext = React.createContext<any>({
  component: 'MockComponent',
  props: {},
  url: '/accueil',
  version: null,
})

const client = createTuyau({
  baseUrl: '/',
  registry,
})

// Decorator qui fournit un mock de usePage via un context
export const withInertia: Decorator = (Story, context) => {
  // Les paramètres de la story peuvent override les valeurs par défaut
  const mockPageData = context.parameters.inertia || {
    component: 'MockComponent',
    props: {},
    url: '/accueil',
    version: null,
  }

  return (
    <TuyauProvider client={client}>
      <InertiaPageContext.Provider value={mockPageData}>
        <Story />
      </InertiaPageContext.Provider>
    </TuyauProvider>
  )
}

// Export du context pour pouvoir être utilisé par le mock
export { InertiaPageContext }
