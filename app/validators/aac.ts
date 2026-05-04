import vine from '@vinejs/vine'

export const analysesSummaryValidator = vine.compile(
  vine.object({
    yearFrom: vine.number().withoutDecimals().optional(),
    yearTo: vine.number().withoutDecimals().optional(),
  })
)

export const analysesValidator = vine.compile(
  vine.object({
    year: vine.number().withoutDecimals(),
  })
)

export const yearRangeValidator = vine.compile(
  vine.object({
    yearMin: vine.number().withoutDecimals(),
    yearMax: vine.number().withoutDecimals(),
  })
)
