import Reveal, { RevealProps } from './index'

const meta = {
  title: 'UI/Reveal',
  component: Reveal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Anime l'apparition de son contenu lorsqu'il entre dans le viewport. L'animation est désactivée si l'utilisateur a activé `prefers-reduced-motion`.",
      },
    },
  },
  argTypes: {
    direction: {
      control: 'radio',
      options: ['up', 'down', 'left', 'right', 'none'],
      description: "Direction depuis laquelle l'élément apparaît.",
      table: {
        defaultValue: { summary: 'up' },
      },
    },
    delay: {
      control: 'number',
      description: "Délai avant le déclenchement de l'animation (en ms).",
      table: {
        defaultValue: { summary: '0' },
      },
    },
    duration: {
      control: 'number',
      description: "Durée de l'animation (en ms).",
      table: {
        defaultValue: { summary: '700' },
      },
    },
    distance: {
      control: 'number',
      description: 'Distance de translation initiale (en px).',
      table: {
        defaultValue: { summary: '32' },
      },
    },
    once: {
      control: 'boolean',
      description: "Si faux, rejoue l'animation à chaque entrée dans le viewport.",
      table: {
        defaultValue: { summary: 'true' },
      },
    },
  },
  args: {
    direction: 'up',
    children: (
      <div className="fr-p-4w" style={{ border: '1px solid currentColor' }}>
        Contenu révélé au défilement
      </div>
    ),
  } as RevealProps,
}

export default meta

export const Défaut = {}

export const DepuisLaGauche = {
  args: {
    direction: 'left',
  },
}

export const AvecDélai = {
  args: {
    delay: 500,
  },
}
