import { defineConfig } from 'vite'
import inertia from '@adonisjs/inertia/vite'
import react from '@vitejs/plugin-react'
import adonisjs from '@adonisjs/vite/client'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    inertia({
      ssr: {
        enabled: true,
        entrypoint: 'inertia/ssr.tsx',
      },
    }),
    react(),
    adonisjs({
      entrypoints: [
        'inertia/app.tsx',
        'inertia/pages/errors/server_error.tsx',
        'inertia/pages/errors/not_found.tsx',
      ],
      reload: ['resources/views/**/*.edge'],
    }),
    tailwindcss(),
  ],
  /**
   * Define aliases for importing modules from
   * your frontend code
   */
  resolve: {
    alias: {
      '~/': `${import.meta.dirname}/inertia/`,
      '@generated': `${import.meta.dirname}/.adonisjs/client/`,
    },
  },
  ssr: {
    noExternal: ['@codegouvfr/react-dsfr'],
  },
})
