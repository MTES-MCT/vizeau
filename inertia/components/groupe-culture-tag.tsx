import { GROUPES_CULTURAUX } from '~/functions/cultures-group'
import CustomTag from '../ui/CustomTag'

export type GroupeCultureTagProps = {
  code_group: string | number
  size?: 'md' | 'sm'
}

export default function GroupeCultureTag({ code_group, size = 'md' }: GroupeCultureTagProps) {
  const cultureGroup = GROUPES_CULTURAUX[code_group]

  return <CustomTag label={cultureGroup?.label} size={size} color={cultureGroup.color} />
}
