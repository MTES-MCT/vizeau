import vine from '@vinejs/vine'

export const assignParcellesToExploitationValidator = vine.compile(
  vine.object({
    exploitationId: vine.string().uuid(),
    year: vine.number().withoutDecimals().min(1900).max(new Date().getFullYear()),
    parcelles: vine.array(
      vine.object({
        rpgId: vine.string().maxLength(16),
        surface: vine.number().min(0).optional(),
        cultureCode: vine.string().maxLength(3).optional(),
        centroid: vine
          .object({ x: vine.number().min(-180).max(180), y: vine.number().min(-90).max(90) })
          .optional(),
      })
    ),
  })
)

export const detachParcelleValidator = vine.compile(
  vine.object({
    params: vine.object({
      exploitationId: vine.string().uuid(),
      rpgId: vine.string().maxLength(16),
    }),
    year: vine.number().withoutDecimals().min(1900).max(new Date().getFullYear()),
  })
)

export const getParcelleNoteValidator = vine.compile(
  vine.object({
    params: vine.object({
      exploitationId: vine.string().uuid(),
      rpgId: vine.string().maxLength(16),
    }),
    year: vine.number().withoutDecimals().min(1900).max(new Date().getFullYear()),
  })
)

export const updateParcelleNoteValidator = vine.compile(
  vine.object({
    params: vine.object({
      exploitationId: vine.string().uuid(),
      rpgId: vine.string().maxLength(16),
    }),
    year: vine.number().withoutDecimals().min(1900).max(new Date().getFullYear()),
    comment: vine.string().maxLength(5000).nullable(),
  })
)

// Millésime des parcelles indisponibles, chargées à la demande par le formulaire d'exploitation
export const unavailableParcellesQueryValidator = vine.compile(
  vine.object({
    millesime: vine.number().withoutDecimals().min(1900).max(new Date().getFullYear()),
  })
)

// Parcelles de l'exploitation, tous millésimes confondus, enregistrées depuis sa page
export const updateExploitationParcellesValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
    parcelles: vine.array(
      vine.object({
        year: vine.number().withoutDecimals().min(1900).max(new Date().getFullYear()),
        rpgId: vine.string().maxLength(16),
        surface: vine.number().min(0).optional(),
        cultureCode: vine.string().maxLength(3).optional(),
        centroid: vine
          .object({ x: vine.number().min(-180).max(180), y: vine.number().min(-90).max(90) })
          .optional(),
      })
    ),
  })
)
