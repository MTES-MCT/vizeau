import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../inertia/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (viteConfig) => {
    // Alias pour mocker @inertiajs/react dans Storybook
    viteConfig.resolve = viteConfig.resolve || {}
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      '@inertiajs/react': new URL('./inertia-mock.tsx', import.meta.url).pathname,
    }
    return viteConfig
  },
}
export default config
