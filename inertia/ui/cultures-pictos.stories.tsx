import { useState } from 'react'
import { values } from 'lodash-es'
import { fr } from '@codegouvfr/react-dsfr'

import { GROUPES_CULTURAUX } from '~/functions/cultures-group'

import Input from '@codegouvfr/react-dsfr/Input'
export default {
  title: '🌱 Cultures pictos',
}

export const CulturesPictos = () => {
  const groupesArray = values(GROUPES_CULTURAUX)
  const [search, setSearch] = useState('')

  const filteredGroupes = groupesArray.filter(
    (groupe) =>
      groupe.code.toLowerCase().includes(search.toLowerCase()) ||
      groupe.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <h3>Groupe de cultures</h3>

      <Input
        label="Rechercher par code ou libellé..."
        nativeInputProps={{
          value: search,
          onChange: (e) => setSearch(e.target.value),
        }}
        style={{ width: '33%', minWidth: '320px', marginBottom: '50px' }}
      />

      <div className="flex flex-wrap gap-6">
        {filteredGroupes.map((groupe) => (
          <div
            key={groupe.code}
            className="flex flex-col items-center justify-between fr-p-3v rounded-sm box-border gap-3"
            style={{
              border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            }}
          >
            <div
              className="w-[54px] h-[54px] flex items-center rounded justify-center fr-p-2v"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <img src={groupe.picto} alt={groupe.label} className="h-full w-full object-contain" />
            </div>

            <div className="text-start fr-mb-2">
              <div>
                <strong>libellé :</strong> <span>{groupe.label}</span>
              </div>
              <div>
                <strong>code :</strong> <span>{groupe.code}</span>
              </div>
            </div>

            <div className="flex flex-col items-center w-full gap-1.25">
              <div className="h-[30px] min-w-[300px] rounded" style={{ backgroundColor: groupe.color }} />
              <span style={{ color: '#666666' }}>{groupe.color}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
