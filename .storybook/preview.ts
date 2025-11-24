import type { Preview } from '@storybook/react-vite'
import '@codegouvfr/react-dsfr/main.css'
import '@codegouvfr/react-dsfr/dsfr/dsfr.css'
import '@codegouvfr/react-dsfr/dsfr/utility/icons/icons.css'
import '../inertia/css/app.css'
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa'
import React from 'react'
import type { Decorator } from '@storybook/react'

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

  argTypes: {
    theme: {
      control: { type: 'radio' },
      options: ['light', 'dark'],
      description: 'Thème DSFR (light ou dark)',
      table: {
        category: 'Thème',
        defaultValue: { summary: 'light' },
      },
    },
  },

  args: {
    theme: 'light',
  },

  decorators: [
    ((Story, context) => {
      const theme = (context.args.theme as string) || 'light'
      const backgroundColor = theme === 'dark' ? '#1e1e1e' : '#ffffff'

      // Appliquer le thème sur la balise html
      React.useEffect(() => {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-fr-scheme', theme)
          document.documentElement.style.colorScheme = theme
        }
      }, [theme])

      return React.createElement(
        'div',
        { style: { backgroundColor, padding: '1rem' } },
        React.createElement(Story)
      )
    }) as Decorator,
  ],
}

export default preview
