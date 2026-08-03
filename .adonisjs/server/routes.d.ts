import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'root': { paramsTuple?: []; params?: {} }
    'session.index': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.delete': { paramsTuple?: []; params?: {} }
    'noTerritoire': { paramsTuple?: []; params?: {} }
    'accueil': { paramsTuple?: []; params?: {} }
    'visualisation.index': { paramsTuple?: []; params?: {} }
    'visualisation.assignParcellesToExploitation': { paramsTuple?: []; params?: {} }
    'exploitations.index': { paramsTuple?: []; params?: {} }
    'exploitations.create': { paramsTuple?: []; params?: {} }
    'exploitations.edition': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exploitations.getBySiret': { paramsTuple: [ParamValue]; params: {'siret': ParamValue} }
    'exploitations.get': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exploitations.store': { paramsTuple?: []; params?: {} }
    'exploitations.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exploitations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exploitations.detachParcelle': { paramsTuple: [ParamValue,ParamValue]; params: {'exploitationId': ParamValue,'rpgId': ParamValue} }
    'parcelles.note.update': { paramsTuple: [ParamValue,ParamValue]; params: {'exploitationId': ParamValue,'rpgId': ParamValue} }
    'parcelles.export': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'exploitations.export': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.index': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.export': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.get': { paramsTuple: [ParamValue,ParamValue]; params: {'exploitationId': ParamValue,'logEntryId': ParamValue} }
    'log_entries.edition': { paramsTuple: [ParamValue,ParamValue]; params: {'exploitationId': ParamValue,'logEntryId': ParamValue} }
    'log_entries.create': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.complete': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.edit': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.destroy': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.createTagForExploitation': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.destroyTagForExploitation': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.downloadDocument': { paramsTuple: [ParamValue]; params: {'documentId': ParamValue} }
    'log_entries.destroyDocument': { paramsTuple?: []; params?: {} }
    'aac.index': { paramsTuple?: []; params?: {} }
    'aac.show': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.analysesSummary': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.infoGenerale': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.captages': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.assolement': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.cultureEvolution': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.qualite': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.showInstallation': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.substances': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.substanceChronique': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue,'codeParametre': ParamValue} }
    'aac.analysesPerYear': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.analysesYears': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.analysesStats': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.analyses': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'projets.index': { paramsTuple?: []; params?: {} }
    'projets.create': { paramsTuple?: []; params?: {} }
    'projets.edition': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.show': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.store': { paramsTuple?: []; params?: {} }
    'projets.update': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.destroy': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.create.form': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.get': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.edition': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.create': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.complete': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.documents.download': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue,'documentId': ParamValue} }
    'projets.steps.documents.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.tags.create': { paramsTuple?: []; params?: {} }
    'projets.steps.tags.destroy': { paramsTuple?: []; params?: {} }
    'territoires.index': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'root': { paramsTuple?: []; params?: {} }
    'session.index': { paramsTuple?: []; params?: {} }
    'session.delete': { paramsTuple?: []; params?: {} }
    'noTerritoire': { paramsTuple?: []; params?: {} }
    'accueil': { paramsTuple?: []; params?: {} }
    'visualisation.index': { paramsTuple?: []; params?: {} }
    'exploitations.index': { paramsTuple?: []; params?: {} }
    'exploitations.create': { paramsTuple?: []; params?: {} }
    'exploitations.edition': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exploitations.getBySiret': { paramsTuple: [ParamValue]; params: {'siret': ParamValue} }
    'exploitations.get': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'parcelles.export': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'exploitations.export': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.index': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.export': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.get': { paramsTuple: [ParamValue,ParamValue]; params: {'exploitationId': ParamValue,'logEntryId': ParamValue} }
    'log_entries.edition': { paramsTuple: [ParamValue,ParamValue]; params: {'exploitationId': ParamValue,'logEntryId': ParamValue} }
    'log_entries.downloadDocument': { paramsTuple: [ParamValue]; params: {'documentId': ParamValue} }
    'aac.index': { paramsTuple?: []; params?: {} }
    'aac.show': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.analysesSummary': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.infoGenerale': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.captages': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.assolement': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.cultureEvolution': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.qualite': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.showInstallation': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.substances': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.substanceChronique': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue,'codeParametre': ParamValue} }
    'aac.analysesPerYear': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.analysesYears': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.analysesStats': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.analyses': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'projets.index': { paramsTuple?: []; params?: {} }
    'projets.create': { paramsTuple?: []; params?: {} }
    'projets.edition': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.show': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.create.form': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.get': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.edition': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.documents.download': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue,'documentId': ParamValue} }
    'territoires.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'root': { paramsTuple?: []; params?: {} }
    'session.index': { paramsTuple?: []; params?: {} }
    'session.delete': { paramsTuple?: []; params?: {} }
    'noTerritoire': { paramsTuple?: []; params?: {} }
    'accueil': { paramsTuple?: []; params?: {} }
    'visualisation.index': { paramsTuple?: []; params?: {} }
    'exploitations.index': { paramsTuple?: []; params?: {} }
    'exploitations.create': { paramsTuple?: []; params?: {} }
    'exploitations.edition': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exploitations.getBySiret': { paramsTuple: [ParamValue]; params: {'siret': ParamValue} }
    'exploitations.get': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'parcelles.export': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'exploitations.export': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.index': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.export': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.get': { paramsTuple: [ParamValue,ParamValue]; params: {'exploitationId': ParamValue,'logEntryId': ParamValue} }
    'log_entries.edition': { paramsTuple: [ParamValue,ParamValue]; params: {'exploitationId': ParamValue,'logEntryId': ParamValue} }
    'log_entries.downloadDocument': { paramsTuple: [ParamValue]; params: {'documentId': ParamValue} }
    'aac.index': { paramsTuple?: []; params?: {} }
    'aac.show': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.analysesSummary': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.infoGenerale': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.captages': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.assolement': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.cultureEvolution': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.export.qualite': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'aac.showInstallation': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.substances': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.substanceChronique': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue,'codeParametre': ParamValue} }
    'aac.analysesPerYear': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.analysesYears': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.analysesStats': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'aac.analyses': { paramsTuple: [ParamValue,ParamValue]; params: {'code': ParamValue,'installationCode': ParamValue} }
    'projets.index': { paramsTuple?: []; params?: {} }
    'projets.create': { paramsTuple?: []; params?: {} }
    'projets.edition': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.show': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.create.form': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.get': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.edition': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.documents.download': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue,'documentId': ParamValue} }
    'territoires.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'visualisation.assignParcellesToExploitation': { paramsTuple?: []; params?: {} }
    'exploitations.store': { paramsTuple?: []; params?: {} }
    'log_entries.create': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.complete': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.createTagForExploitation': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'projets.store': { paramsTuple?: []; params?: {} }
    'projets.steps.create': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.complete': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.tags.create': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'exploitations.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'parcelles.note.update': { paramsTuple: [ParamValue,ParamValue]; params: {'exploitationId': ParamValue,'rpgId': ParamValue} }
    'log_entries.edit': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'projets.update': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
  }
  DELETE: {
    'exploitations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exploitations.detachParcelle': { paramsTuple: [ParamValue,ParamValue]; params: {'exploitationId': ParamValue,'rpgId': ParamValue} }
    'log_entries.destroy': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.destroyTagForExploitation': { paramsTuple: [ParamValue]; params: {'exploitationId': ParamValue} }
    'log_entries.destroyDocument': { paramsTuple?: []; params?: {} }
    'projets.destroy': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'projets.steps.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.documents.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'projectId': ParamValue,'stepId': ParamValue} }
    'projets.steps.tags.destroy': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}