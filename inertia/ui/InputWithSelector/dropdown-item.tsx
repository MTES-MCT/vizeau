import { useState } from 'react'

export type OptionType = { value: string; label: string; isSelected: boolean }

export type DropdownItemProps = {
  item: OptionType
  onToggle: (value: string) => void
  onDelete?: (value: string) => void
}

export default function DropdownItem({ item, onToggle, onDelete }: DropdownItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors relative">
      <label className="flex items-center gap-3 cursor-pointer flex-1">
        <input
          type="checkbox"
          checked={item.isSelected}
          onChange={() => onToggle(item.value)}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <span className="text-gray-900">{item.label}</span>
      </label>

      {onDelete && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            ...
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded shadow-lg py-1 z-20 min-w-[180px]">
                <button
                  onClick={() => {
                    onDelete(item.value)
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  Supprimer définitivement
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
