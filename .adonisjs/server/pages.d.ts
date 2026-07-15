import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'aac/captage': ExtractProps<(typeof import('../../inertia/pages/aac/captage.tsx'))['default']>
    'aac/id': ExtractProps<(typeof import('../../inertia/pages/aac/id.tsx'))['default']>
    'aac/index': ExtractProps<(typeof import('../../inertia/pages/aac/index.tsx'))['default']>
    'accueil': ExtractProps<(typeof import('../../inertia/pages/accueil.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'exploitations/creation': ExtractProps<(typeof import('../../inertia/pages/exploitations/creation.tsx'))['default']>
    'exploitations/edition': ExtractProps<(typeof import('../../inertia/pages/exploitations/edition.tsx'))['default']>
    'exploitations/id': ExtractProps<(typeof import('../../inertia/pages/exploitations/id.tsx'))['default']>
    'exploitations/index': ExtractProps<(typeof import('../../inertia/pages/exploitations/index.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'journal/creation': ExtractProps<(typeof import('../../inertia/pages/journal/creation.tsx'))['default']>
    'journal/edition': ExtractProps<(typeof import('../../inertia/pages/journal/edition.tsx'))['default']>
    'journal/id': ExtractProps<(typeof import('../../inertia/pages/journal/id.tsx'))['default']>
    'login': ExtractProps<(typeof import('../../inertia/pages/login.tsx'))['default']>
    'no_territoire': ExtractProps<(typeof import('../../inertia/pages/no_territoire.tsx'))['default']>
    'projets/creation': ExtractProps<(typeof import('../../inertia/pages/projets/creation.tsx'))['default']>
    'projets/edition': ExtractProps<(typeof import('../../inertia/pages/projets/edition.tsx'))['default']>
    'projets/etapes/creation': ExtractProps<(typeof import('../../inertia/pages/projets/etapes/creation.tsx'))['default']>
    'projets/etapes/edition': ExtractProps<(typeof import('../../inertia/pages/projets/etapes/edition.tsx'))['default']>
    'projets/etapes/id': ExtractProps<(typeof import('../../inertia/pages/projets/etapes/id.tsx'))['default']>
    'projets/id': ExtractProps<(typeof import('../../inertia/pages/projets/id.tsx'))['default']>
    'projets/index': ExtractProps<(typeof import('../../inertia/pages/projets/index.tsx'))['default']>
    'territoires/index': ExtractProps<(typeof import('../../inertia/pages/territoires/index.tsx'))['default']>
    'visualisation': ExtractProps<(typeof import('../../inertia/pages/visualisation.tsx'))['default']>
  }
}
