import FileItem from './file-item'

export type FileItemsListProps = {
  files: Array<{
    name: string
    href: string
    size?: number | string
    format?: string
    deletable?: boolean
  }>
  onDelete?: (file: { name: string; href: string }, index: number) => void
}

export default function FileItemsList({ files, onDelete }: FileItemsListProps) {
  return (
    <div className="flex flex-col gap-3">
      {files.map((file, index) => (
        <FileItem
          key={`${file.name}-${index}`}
          name={file.name}
          href={file.href}
          size={file.size}
          format={file.format}
          deletable={file.deletable}
          onDelete={onDelete ? () => onDelete(file, index) : undefined}
          isLast={index === files.length - 1}
        />
      ))}
    </div>
  )
}
