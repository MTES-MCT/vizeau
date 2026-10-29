import DepassementsListItem, { DepassementsListItemProps } from './index'

const meta = {
  title: 'UI/DepassementsListItem',
  component: DepassementsListItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Élément de liste affichant un titre, des métadonnées et le nombre de dépassements réglementaires et avec alerte. Utilisé pour les listes d'AAC et de captages. Peut être utilisé comme lien.",
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: "Titre de l'élément, tronqué sur une ligne.",
    },
    metas: {
      control: 'object',
      description: `Liste des métadonnées à afficher.\nExemple : [{ content: 'Meta', iconId: 'fr-icon-map-pin-2-line' }]`,
    },
    priority: {
      control: 'radio',
      options: ['primary', 'secondary'],
      description:
        'Priorité visuelle affectant la couleur de fond.\n- primary : fond gris\n- secondary : fond bleu France',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    depassementsReglementaires: {
      control: 'number',
      description: 'Nombre de dépassements réglementaires. Masqué si nul.',
    },
    depassementsAlerte: {
      control: 'number',
      description: 'Nombre de dépassements avec alerte. Masqué si nul.',
    },
    linkProps: {
      control: 'object',
      description: "Si défini, l'élément devient un lien vers `href`.",
    },
    additionalInfos: {
      control: 'object',
      description: "Informations additionnelles à afficher en haut de l'élément.",
      table: {
        type: { summary: 'AdditionalInfosProps' },
      },
    },
  },
  args: {
    title: 'AAC de la Vallée de la Seine',
    metas: [
      { content: '12 captages', iconId: 'fr-icon-drop-line' },
      { content: 'Seine-et-Marne', iconId: 'fr-icon-map-pin-2-line' },
    ],
    priority: 'primary',
    depassementsReglementaires: 3,
    depassementsAlerte: 1,
  } as DepassementsListItemProps,
}

export default meta

export const Défaut = {}

export const Secondaire = {
  args: {
    priority: 'secondary',
  },
}

export const SansDépassement = {
  args: {
    depassementsReglementaires: 0,
    depassementsAlerte: null,
  },
}

export const AvecInfosAdditionnelles = {
  args: {
    additionalInfos: {
      alert: {
        text: 'Captage abandonné',
        severity: 'warning',
      },
    },
  },
}

export const EnTantQueLien = {
  args: {
    linkProps: { href: '#' },
  },
}
