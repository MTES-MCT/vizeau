import LabelInfo from '../LabelInfo'

export type MetasListProps = {
  metas: { content: string; iconId: string }[]
  size?: 'sm' | 'md'
}

export default function MetasList({ metas, size }: MetasListProps) {
  return (
    <div className="flex gap-4">
      {metas.map((meta, index) => (
        <LabelInfo key={index} icon={meta.iconId} label={meta.content} size={size || 'md'} />
      ))}
    </div>
  )
}
