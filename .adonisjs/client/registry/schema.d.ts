/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'root': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'session.index': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['index']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
    }
  }
  'session.delete': {
    methods: ["GET","HEAD"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['delete']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['delete']>>>
    }
  }
  'noTerritoire': {
    methods: ["GET","HEAD"]
    pattern: '/pas-de-territoire'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/accueil_controller').default['noTerritoire']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/accueil_controller').default['noTerritoire']>>>
    }
  }
  'accueil.index': {
    methods: ["GET","HEAD"]
    pattern: '/accueil'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/accueil_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/accueil_controller').default['index']>>>
    }
  }
  'visualisation.index': {
    methods: ["GET","HEAD"]
    pattern: '/visualisation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/visualisation_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/visualisation_controller').default['index']>>>
    }
  }
  'visualisation.assignParcellesToExploitation': {
    methods: ["POST"]
    pattern: '/visualisation/parcelles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/parcelle').assignParcellesToExploitationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/parcelle').assignParcellesToExploitationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/visualisation_controller').default['assignParcellesToExploitation']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/visualisation_controller').default['assignParcellesToExploitation']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'exploitations.index': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['index']>>>
    }
  }
  'exploitations.create': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations/creation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['create']>>>
    }
  }
  'exploitations.edition': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations/edition/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['getForEdition']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['getForEdition']>>>
    }
  }
  'exploitations.getBySiret': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations/siret/:siret'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { siret: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['getBySiret']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['getBySiret']>>>
    }
  }
  'exploitations.get': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['get']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['get']>>>
    }
  }
  'exploitations.store': {
    methods: ["POST"]
    pattern: '/exploitations/creation'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/create_exploitation').createExploitationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/create_exploitation').createExploitationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'exploitations.edit': {
    methods: ["PATCH"]
    pattern: '/exploitations/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/create_exploitation').updateExploitationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/create_exploitation').updateExploitationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['edit']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'exploitations.destroy': {
    methods: ["DELETE"]
    pattern: '/exploitations/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['destroy']>>>
    }
  }
  'exploitations.detachParcelle': {
    methods: ["DELETE"]
    pattern: '/exploitations/:exploitationId/parcelles/:rpgId/detach'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/parcelle').detachParcelleValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { exploitationId: ParamValue; rpgId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/parcelle').detachParcelleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['detachParcelle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['detachParcelle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'parcelles.note.update': {
    methods: ["PATCH"]
    pattern: '/exploitations/:exploitationId/parcelles/:rpgId/note'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/parcelle').updateParcelleNoteValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { exploitationId: ParamValue; rpgId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/parcelle').updateParcelleNoteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['updateParcelleNote']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['updateParcelleNote']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'parcelles.export': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations/:exploitationId/parcelles/export'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { exploitationId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['exportParcellesCsv']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['exportParcellesCsv']>>>
    }
  }
  'exploitations.export': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations/:exploitationId/export'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { exploitationId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['exportExploitationCsv']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exploitations_controller').default['exportExploitationCsv']>>>
    }
  }
  'log_entries.index': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations/:exploitationId/journal'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { exploitationId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['index']>>>
    }
  }
  'log_entries.export': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations/:exploitationId/journal/export'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { exploitationId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['exportCsv']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['exportCsv']>>>
    }
  }
  'log_entries.get': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations/:exploitationId/journal/:logEntryId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { exploitationId: ParamValue; logEntryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['get']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['get']>>>
    }
  }
  'log_entries.edition': {
    methods: ["GET","HEAD"]
    pattern: '/exploitations/:exploitationId/journal/:logEntryId/edition'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { exploitationId: ParamValue; logEntryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['getForEdition']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['getForEdition']>>>
    }
  }
  'log_entries.create': {
    methods: ["POST"]
    pattern: '/exploitations/:exploitationId/journal'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/log_entry').createLogEntryValidator)>>
      paramsTuple: [ParamValue]
      params: { exploitationId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/log_entry').createLogEntryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['create']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'log_entries.complete': {
    methods: ["POST"]
    pattern: '/exploitations/:exploitationId/journal/complete'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/log_entry').completeLogEntryValidator)>>
      paramsTuple: [ParamValue]
      params: { exploitationId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/log_entry').completeLogEntryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['complete']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['complete']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'log_entries.edit': {
    methods: ["PATCH"]
    pattern: '/exploitations/:exploitationId/journal'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/log_entry').updateLogEntryValidator)>>
      paramsTuple: [ParamValue]
      params: { exploitationId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/log_entry').updateLogEntryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['edit']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'log_entries.destroy': {
    methods: ["DELETE"]
    pattern: '/exploitations/:exploitationId/journal'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/log_entry').destroyLogEntryValidator)>>
      paramsTuple: [ParamValue]
      params: { exploitationId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/log_entry').destroyLogEntryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'log_entries.createTagForExploitation': {
    methods: ["POST"]
    pattern: '/exploitations/:exploitationId/tags'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/log_entry_tag').createLogEntryTagValidator)>>
      paramsTuple: [ParamValue]
      params: { exploitationId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/log_entry_tag').createLogEntryTagValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['createTagForExploitation']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['createTagForExploitation']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'log_entries.destroyTagForExploitation': {
    methods: ["DELETE"]
    pattern: '/exploitations/:exploitationId/tags'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/log_entry_tag').deleteLogEntryTagValidator)>>
      paramsTuple: [ParamValue]
      params: { exploitationId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/log_entry_tag').deleteLogEntryTagValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['destroyTagForExploitation']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['destroyTagForExploitation']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'log_entries.downloadDocument': {
    methods: ["GET","HEAD"]
    pattern: '/journal-document/:documentId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { documentId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/log_entry').downloadDocumentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['downloadDocument']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['downloadDocument']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'log_entries.destroyDocument': {
    methods: ["DELETE"]
    pattern: '/journal-document'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/log_entry').destroyDocumentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/log_entry').destroyDocumentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['destroyDocument']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/log_entries_controller').default['destroyDocument']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'aac.index': {
    methods: ["GET","HEAD"]
    pattern: '/aac'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['index']>>>
    }
  }
  'aac.show': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['show']>>>
    }
  }
  'aac.analysesSummary': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/analyses/summary'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/aac').analysesSummaryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['analysesSummary']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['analysesSummary']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'aac.export.infoGenerale': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/export/general'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['exportInfoGenerale']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['exportInfoGenerale']>>>
    }
  }
  'aac.export.captages': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/export/captages'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['exportCaptages']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['exportCaptages']>>>
    }
  }
  'aac.export.assolement': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/export/assolement'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['exportAssolement']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['exportAssolement']>>>
    }
  }
  'aac.export.cultureEvolution': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/export/culture-evolution'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['exportCultureEvolution']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['exportCultureEvolution']>>>
    }
  }
  'aac.export.qualite': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/export/qualite'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['exportQualiteEau']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['exportQualiteEau']>>>
    }
  }
  'aac.showInstallation': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/installations/:installationCode'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { code: ParamValue; installationCode: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['showInstallation']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['showInstallation']>>>
    }
  }
  'aac.substances': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/installations/:installationCode/analyses/substances'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { code: ParamValue; installationCode: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/aac').yearRangeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['substances']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['substances']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'aac.substanceChronique': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/installations/:installationCode/analyses/substances/:codeParametre'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue, ParamValue]
      params: { code: ParamValue; installationCode: ParamValue; codeParametre: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/aac').yearRangeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['substanceChronique']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['substanceChronique']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'aac.analysesPerYear': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/installations/:installationCode/analyses/per-year'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { code: ParamValue; installationCode: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/aac').yearRangeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['analysesPerYear']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['analysesPerYear']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'aac.analysesYears': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/installations/:installationCode/analyses/years'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { code: ParamValue; installationCode: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['analysesYears']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['analysesYears']>>>
    }
  }
  'aac.analysesStats': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/installations/:installationCode/analyses/stats'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { code: ParamValue; installationCode: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/aac').yearRangeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['analysesStats']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['analysesStats']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'aac.analyses': {
    methods: ["GET","HEAD"]
    pattern: '/aac/:code/installations/:installationCode/analyses'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { code: ParamValue; installationCode: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/aac').analysesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['analyses']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/aac_controller').default['analyses']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.index': {
    methods: ["GET","HEAD"]
    pattern: '/projets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/project').indexProjectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.create': {
    methods: ["GET","HEAD"]
    pattern: '/projets/creation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['create']>>>
    }
  }
  'projets.edition': {
    methods: ["GET","HEAD"]
    pattern: '/projets/edition/:projectId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { projectId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/project').showProjectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['getForEdition']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['getForEdition']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.show': {
    methods: ["GET","HEAD"]
    pattern: '/projets/:projectId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { projectId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/project').showProjectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.store': {
    methods: ["POST"]
    pattern: '/projets'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project').createProjectValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/project').createProjectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.update': {
    methods: ["PATCH"]
    pattern: '/projets/:projectId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project').updateProjectValidator)>>
      paramsTuple: [ParamValue]
      params: { projectId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/project').updateProjectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.destroy': {
    methods: ["DELETE"]
    pattern: '/projets/:projectId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project').destroyProjectValidator)>>
      paramsTuple: [ParamValue]
      params: { projectId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/project').destroyProjectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.create.form': {
    methods: ["GET","HEAD"]
    pattern: '/projets/:projectId/etapes/creation'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { projectId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/project').showProjectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['createStepForm']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['createStepForm']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.get': {
    methods: ["GET","HEAD"]
    pattern: '/projets/:projectId/etapes/:stepId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { projectId: ParamValue; stepId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/project_step').showProjectStepValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['getStep']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['getStep']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.edition': {
    methods: ["GET","HEAD"]
    pattern: '/projets/:projectId/etapes/:stepId/edition'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { projectId: ParamValue; stepId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/project_step').showProjectStepValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['getStepForEdition']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['getStepForEdition']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.create': {
    methods: ["POST"]
    pattern: '/projets/:projectId/etapes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project').showProjectValidator)>|InferInput<(typeof import('#validators/project_step').createProjectStepPayloadValidator)>>
      paramsTuple: [ParamValue]
      params: { projectId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/project').showProjectValidator)>|InferInput<(typeof import('#validators/project_step').createProjectStepPayloadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['createStep']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['createStep']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.complete': {
    methods: ["POST"]
    pattern: '/projets/:projectId/etapes/complete'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project_step').completeProjectStepValidator)>>
      paramsTuple: [ParamValue]
      params: { projectId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/project_step').completeProjectStepValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['completeStep']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['completeStep']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.edit': {
    methods: ["PATCH"]
    pattern: '/projets/:projectId/etapes/:stepId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project_step').showProjectStepValidator)>|InferInput<(typeof import('#validators/project_step').updateProjectStepPayloadValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { projectId: ParamValue; stepId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/project_step').showProjectStepValidator)>|InferInput<(typeof import('#validators/project_step').updateProjectStepPayloadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['editStep']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['editStep']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.destroy': {
    methods: ["DELETE"]
    pattern: '/projets/:projectId/etapes/:stepId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project_step').showProjectStepValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { projectId: ParamValue; stepId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/project_step').showProjectStepValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['destroyStep']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['destroyStep']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.documents.download': {
    methods: ["GET","HEAD"]
    pattern: '/projets/:projectId/etapes/:stepId/documents/:documentId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue, ParamValue]
      params: { projectId: ParamValue; stepId: ParamValue; documentId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/project_step').downloadProjectStepDocumentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['downloadStepDocument']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['downloadStepDocument']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.documents.destroy': {
    methods: ["DELETE"]
    pattern: '/projets/:projectId/etapes/:stepId/documents'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project_step').destroyProjectStepDocumentValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { projectId: ParamValue; stepId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/project_step').destroyProjectStepDocumentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['destroyDocument']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['destroyDocument']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.tags.create': {
    methods: ["POST"]
    pattern: '/projet-tags'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project_step').createProjectStepTagValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/project_step').createProjectStepTagValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['createTag']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['createTag']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projets.steps.tags.destroy': {
    methods: ["DELETE"]
    pattern: '/projet-tags'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project_step').deleteProjectStepTagValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/project_step').deleteProjectStepTagValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['destroyTag']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/project_steps_controller').default['destroyTag']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'territoires.index': {
    methods: ["GET","HEAD"]
    pattern: '/territoires'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/territoires_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/territoires_controller').default['index']>>>
    }
  }
}
