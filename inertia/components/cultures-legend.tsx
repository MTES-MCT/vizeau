import { values } from 'lodash-es'
import { GROUPES_CULTURAUX, getContrastedPicto } from '~/functions/cultures-group'

export default function CulturesLegend() {
  const culturesItems = values(GROUPES_CULTURAUX)

  return (
    <div className="flex flex-col gap-1">
      {culturesItems.map((culture) => (
        <div key={culture.code_group} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: culture.color }} />
          <img src={getContrastedPicto(culture)} alt={culture.label} className="w-4 h-4 mr-2" />
          <span className="text-sm">{culture.label}</span>
        </div>
      ))}
    </div>
  )
}
