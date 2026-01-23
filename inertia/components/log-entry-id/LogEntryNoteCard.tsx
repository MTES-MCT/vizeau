import SectionCard from '~/ui/SectionCard'

export type LogEntryNoteCardProps = {
  notes?: string | null
}

export default function LogEntryNoteCard({ notes }: LogEntryNoteCardProps) {
  return (
    <SectionCard title="Note" size={'small'} icon="fr-icon-draft-line" background="secondary">
      {notes}
    </SectionCard>
  )
}
