import LabelInfo from '../LabelInfo'

export type MetasListProps = {
  metas: { content: string | null; iconId: string | null }[]
  size?: 'sm' | 'md'
}

export default function MetasList({ metas, size = 'md' }: MetasListProps) {
  return (
    <div className="flex gap-x-4 gap-y-1 flex-wrap">
      {metas?.map((meta, index) => (
        <LabelInfo
          key={index + (meta.content ?? '')}
          icon={meta.iconId}
          label={meta.content || ''}
          size={size}
        />
      ))}
    </div>
  )
}
