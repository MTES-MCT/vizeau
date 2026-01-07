import FileItemsList, { FileItemsListProps } from './index'

const meta = {
  title: 'UI/FileItemsList',
  component: FileItemsList,
  tags: ['autodocs'],
  argTypes: {
    files: {
      control: 'object',
      description: `Liste des fichiers à afficher. Chaque élément du tableau doit contenir :
- \`name\` (string) : Nom du fichier
- \`href\` (string) : URL ou chemin du fichier
- \`size\` (number | string, optionnel) : Taille du fichier en octets
- \`format\` (string, optionnel) : Format/extension du fichier (ex: 'pdf', 'jpg')
- \`deletable\` (boolean, optionnel) : Si le fichier peut être supprimé`,
      table: {
        type: { summary: 'Array<FileItem>' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Composant pour afficher une liste de fichiers avec leurs informations (nom, taille, format, etc.).',
      },
    },
  },
  args: {
    files: [
      {
        name: 'Exemple de fichier1',
        href: 'https://example.com/fichier.pdf',
        size: 15243523,
        format: 'pdf',
        deletable: true,
      },
      {
        name: 'Exemple de fichier 2',
        href: 'https://example.com/fichier.pdf',
        size: 152435198,
        format: 'pdf',
        deletable: true,
      },
    ],
  } as FileItemsListProps,
}

export default meta

export const Défaut = {}
