import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { ProjectStatus } from '#models/project'

export const createProjectValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(255),
    description: vine.string().maxLength(4000).optional().nullable(),
    actionType: vine.string().maxLength(255).optional().nullable(),
    status: vine.enum(Object.values(ProjectStatus)).optional(),
    parcelleIds: vine.array(vine.string().uuid()).optional(),
    exploitationIds: vine.array(vine.string().uuid()).optional(),
    captageIds: vine.array(vine.string().uuid()).optional(),
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
    closedAt: vine
      .date()
      .optional()
      .nullable()
      .transform((value) => (value ? DateTime.fromJSDate(value) : value)),
    parcelleIds: vine.array(vine.string().uuid()).optional(),
    exploitationIds: vine.array(vine.string().uuid()).optional(),
    captageIds: vine.array(vine.string().uuid()).optional(),
    params: vine.object({
      projectId: vine.string().uuid(),
    }),
  })
)
