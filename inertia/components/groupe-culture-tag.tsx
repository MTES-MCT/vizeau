import { GROUPES_CULTURAUX, getContrastedPicto } from '~/functions/cultures-group'
import { fr } from '@codegouvfr/react-dsfr'
import CustomTag from '../ui/CustomTag'

export type GroupeCultureTagProps = {
  code_group: string | number
  size?: 'md' | 'sm'
}

export default function GroupeCultureTag({ code_group, size = 'md' }: GroupeCultureTagProps) {
  const cultureGroup = GROUPES_CULTURAUX[code_group]
  const backgroundColor = cultureGroup.color || fr.colors.decisions.background.default.grey.active
  const pictoPath = getContrastedPicto(cultureGroup, backgroundColor)

  return (
    <CustomTag
      label={cultureGroup?.label}
      iconPath={pictoPath}
      size={size}
      color={cultureGroup.color}
    />
  )
}
