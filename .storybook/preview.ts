import type { Preview } from '@storybook/react-vite'
import '@codegouvfr/react-dsfr/main.css'
import '@codegouvfr/react-dsfr/dsfr/dsfr.css'
import '@codegouvfr/react-dsfr/dsfr/utility/icons/icons.css'
import '../inertia/css/app.css'
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa'

startReactDsfr({ defaultColorScheme: 'system' })

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
