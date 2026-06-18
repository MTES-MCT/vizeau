import vine from '@vinejs/vine'

const stepPayloadSchema = {
  title: vine.string().maxLength(255).optional(),
  note: vine.string().maxLength(4000).optional(),
  date: vine.string().optional().nullable(),
  tags: vine.array(vine.number()).optional(),
  documents: vine.array(vine.file({ extnames: ['pdf'] })).optional(),
}

export const showProjectStepValidator = vine.compile(
  vine.object({
    params: vine.object({
      projectId: vine.string().uuid(),
      stepId: vine.string().uuid(),
    }),
  })
)

export const createProjectStepValidator = vine.compile(
  vine.object({
    params: vine.object({
      projectId: vine.string().uuid(),
    }),
    ...stepPayloadSchema,
  })
)

export const updateProjectStepValidator = vine.compile(
  vine.object({
    params: vine.object({
      projectId: vine.string().uuid(),
      stepId: vine.string().uuid(),
    }),
    ...stepPayloadSchema,
  })
)

export const completeProjectStepValidator = vine.compile(
  vine.object({
    params: vine.object({
      projectId: vine.string().uuid(),
    }),
    id: vine.string().uuid(),
  })
)

export const destroyProjectStepValidator = vine.compile(
  vine.object({
    params: vine.object({
      projectId: vine.string().uuid(),
      stepId: vine.string().uuid(),
    }),
  })
)

export const downloadProjectStepDocumentValidator = vine.compile(
  vine.object({
    params: vine.object({
      projectId: vine.string().uuid(),
      stepId: vine.string().uuid(),
      documentId: vine.number().positive().withoutDecimals(),
    }),
  })
)

export const destroyProjectStepDocumentValidator = vine.compile(
  vine.object({
    params: vine.object({
      projectId: vine.string().uuid(),
      stepId: vine.string().uuid(),
    }),
    documentId: vine.number().positive().withoutDecimals(),
  })
)

export const createProjectStepPayloadValidator = vine.compile(
  vine.object({
    title: vine.string().maxLength(255).optional(),
    note: vine.string().maxLength(4000).optional().nullable(),
    date: vine.string().optional().nullable(),
    tags: vine.array(vine.any()).optional(),
  })
)

export const updateProjectStepPayloadValidator = vine.compile(
  vine.object({
    title: vine.string().maxLength(255).optional(),
    note: vine.string().maxLength(4000).optional().nullable(),
    date: vine.string().optional().nullable(),
    tags: vine.array(vine.any()).optional(),
    removedDocumentIds: vine.array(vine.any()).optional(),
  })
)
