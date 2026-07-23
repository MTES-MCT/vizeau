import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { ProjectStatus } from '#models/project'

export const indexProjectValidator = vine.compile(
  vine.object({
    projetsPage: vine.number().positive().withoutDecimals().optional(),
    projetsRecherche: vine.string().maxLength(255).optional(),
    projetsStatut: vine.enum(['all', ...Object.values(ProjectStatus)]).optional(),
    projetsTypesActionExclus: vine.string().maxLength(1000).optional(),
    projetsStatutsExclus: vine.string().maxLength(1000).optional(),
    projetsYearFrom: vine.number().positive().withoutDecimals().optional(),
    projetsYearTo: vine.number().positive().withoutDecimals().optional(),
  })
)

export const createProjectValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(255),
    description: vine.string().maxLength(4000).optional().nullable(),
    actionType: vine.string().maxLength(255).optional().nullable(),
    status: vine.enum(Object.values(ProjectStatus)).optional(),
    territoireIds: vine.array(vine.string().uuid()).minLength(1),
    parcelles: vine
      .array(
        vine.object({
          year: vine.number().withoutDecimals().optional(),
          rpgId: vine.string(),
          surface: vine.number().optional().nullable(),
          cultureCode: vine.string().optional().nullable(),
          centroid: vine
            .object({
              x: vine.number(),
              y: vine.number(),
            })
            .optional()
            .nullable(),
        })
      )
      .optional(),
    millesime: vine
      .string()
      .trim()
      .regex(/^\d{4}$/)
      .optional(),
    parcelleIds: vine.array(vine.string().uuid()).optional(),
    exploitationIds: vine.array(vine.string().uuid()).optional(),
    captageIds: vine.array(vine.string().uuid()).optional(),
    steps: vine
      .array(
        vine.object({
          title: vine.string().maxLength(255).optional(),
          notes: vine.string().maxLength(4000).optional(),
          date: vine.string().optional().nullable(),
          tags: vine.array(vine.number()).optional(),
          documents: vine.array(vine.file({ size: '10mb', extnames: ['pdf'] })).optional(),
        })
      )
      .optional(),
  })
)

export const showProjectValidator = vine.compile(
  vine.object({
    params: vine.object({
      projectId: vine.string().uuid(),
    }),
  })
)
export const destroyProjectValidator = vine.compile(
  vine.object({
    params: vine.object({
      projectId: vine.string().uuid(),
    }),
  })
)

export const updateProjectValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(255).optional(),
    description: vine.string().maxLength(4000).optional().nullable(),
    actionType: vine.string().maxLength(255).optional().nullable(),
    status: vine.enum(Object.values(ProjectStatus)).optional(),
    territoireIds: vine.array(vine.string().uuid()).minLength(1).optional(),
    closedAt: vine
      .date()
      .optional()
      .nullable()
      .transform((value) => (value ? DateTime.fromJSDate(value) : value)),
    parcelles: vine
      .array(
        vine.object({
          year: vine.number().positive().withoutDecimals().optional(),
          rpgId: vine.string(),
          surface: vine.number().optional().nullable(),
          cultureCode: vine.string().optional().nullable(),
          centroid: vine
            .object({
              x: vine.number(),
              y: vine.number(),
            })
            .optional()
            .nullable(),
        })
      )
      .optional(),
    millesime: vine
      .string()
      .trim()
      .regex(/^\d{4}$/)
      .optional(),
    parcelleIds: vine.array(vine.string().uuid()).optional(),
    exploitationIds: vine.array(vine.string().uuid()).optional(),
    captageIds: vine.array(vine.string().uuid()).optional(),
    params: vine.object({
      projectId: vine.string().uuid(),
    }),
  })
)
