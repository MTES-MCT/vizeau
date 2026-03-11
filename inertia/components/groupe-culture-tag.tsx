import { GROUPES_CULTURAUX } from '~/functions/cultures-group'
import CustomTag from '../ui/CustomTag'

export type GroupeCultureTagProps = {
  group_code: string | number
  size?: 'md' | 'sm'
}

export default function GroupeCultureTag({ group_code, size = 'md' }: GroupeCultureTagProps) {
  const cultureGroup = GROUPES_CULTURAUX[group_code]

  return <CustomTag label={cultureGroup?.label} size={size} color={cultureGroup.color} />
}
