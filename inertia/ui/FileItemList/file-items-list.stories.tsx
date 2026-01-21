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
- \`deletable\` (boolean, optionnel) : Si le fichier peut être supprimé. Par défaut, false.`,
      table: {
        type: { summary: 'Array<FileItem>' },
      },
    },
    onDelete: {
      control: 'function',
      description: `Fonction appelée lors de la suppression d'un fichier. Elle reçoit en paramètres :
- \`file\` (FileItem) : L'objet fichier supprimé
- \`index\` (number) : L'index du fichier dans la liste`,
      table: {
        type: { summary: '(file: FileItem, index: number) => void' },
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
        name: 'Exemple de fichier supprimable',
        href: 'https://example.com/fichier.pdf',
        size: 15243523,
        format: 'pdf',
        deletable: true,
      },
      {
        name: 'Exemple de fichier non supprimable',
        href: 'https://example.com/fichier.pdf',
        size: 152435198,
        format: 'pdf',
        deletable: false,
      },
    ],
    onDelete: () => alert('Fichier supprimé'),
  } as FileItemsListProps,
}

export default meta

export const Défaut = {}

export const SansTaille = {
  args: {
    files: [
      {
        name: 'Fichier A',
        href: 'https://example.com/fichier1.pdf',
        format: 'pdf',
      },
      {
        name: 'Fichier B',
        href: 'https://example.com/fichier2.pdf',
        format: 'pdf',
      },
    ],
  },
}

export const SansFormatAffiché = {
  args: {
    files: [
      {
        name: 'Fichier A',
        href: 'https://example.com/fichier1',
        size: 204800,
      },
      {
        name: 'Fichier B',
        href: 'https://example.com/fichier2.jpg',
        size: 512000,
      },
    ],
  },
}
