import FileItem from './file-item'

export type FileItemsListProps = {
  files: Array<{
    name: string
    href: string
    size?: number | string
    format?: string
    deletable?: boolean
  }>
}

export default function FileItemsList({ files }: FileItemsListProps) {
  return (
    <div className="flex flex-col gap-3">
      {files.map((file, index) => (
        <FileItem
          key={file.href}
          name={file.name}
          href={file.href}
          size={file.size}
          format={file.format}
          deletable={file.deletable}
          isLast={index === files.length - 1}
        />
      ))}
    </div>
  )
}
