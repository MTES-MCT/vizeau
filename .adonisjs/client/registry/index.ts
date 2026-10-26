/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'root': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['root']['types'],
  },
  'session.index': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.index']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.store']['types'],
  },
  'session.delete': {
    methods: ["GET","HEAD"],
    pattern: '/logout',
    tokens: [[0,"logout"]],
    types: placeholder as Registry['session.delete']['types'],
  },
  'noTerritoire': {
    methods: ["GET","HEAD"],
    pattern: '/pas-de-territoire',
    tokens: [[0,"pas-de-territoire"]],
    types: placeholder as Registry['noTerritoire']['types'],
  },
  'accueil': {
    methods: ["GET","HEAD"],
    pattern: '/accueil',
    tokens: [[0,"accueil"]],
    types: placeholder as Registry['accueil']['types'],
  },
  'visualisation.index': {
    methods: ["GET","HEAD"],
    pattern: '/visualisation',
    tokens: [[0,"visualisation"]],
    types: placeholder as Registry['visualisation.index']['types'],
  },
  'visualisation.assignParcellesToExploitation': {
    methods: ["POST"],
    pattern: '/visualisation/parcelles',
    tokens: [[0,"visualisation"],[0,"parcelles"]],
    types: placeholder as Registry['visualisation.assignParcellesToExploitation']['types'],
  },
  'exploitations.index': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations',
    tokens: [[0,"exploitations"]],
    types: placeholder as Registry['exploitations.index']['types'],
  },
  'exploitations.create': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations/creation',
    tokens: [[0,"exploitations"],[0,"creation"]],
    types: placeholder as Registry['exploitations.create']['types'],
  },
  'exploitations.edition': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations/edition/:id',
    tokens: [[0,"exploitations"],[0,"edition"],[1,"id"]],
    types: placeholder as Registry['exploitations.edition']['types'],
  },
  'exploitations.getBySiret': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations/siret/:siret',
    tokens: [[0,"exploitations"],[0,"siret"],[1,"siret"]],
    types: placeholder as Registry['exploitations.getBySiret']['types'],
  },
  'exploitations.get': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations/:id',
    tokens: [[0,"exploitations"],[1,"id"]],
    types: placeholder as Registry['exploitations.get']['types'],
  },
  'exploitations.store': {
    methods: ["POST"],
    pattern: '/exploitations/creation',
    tokens: [[0,"exploitations"],[0,"creation"]],
    types: placeholder as Registry['exploitations.store']['types'],
  },
  'exploitations.edit': {
    methods: ["PATCH"],
    pattern: '/exploitations/:id',
    tokens: [[0,"exploitations"],[1,"id"]],
    types: placeholder as Registry['exploitations.edit']['types'],
  },
  'exploitations.destroy': {
    methods: ["DELETE"],
    pattern: '/exploitations/:id',
    tokens: [[0,"exploitations"],[1,"id"]],
    types: placeholder as Registry['exploitations.destroy']['types'],
  },
  'exploitations.detachParcelle': {
    methods: ["DELETE"],
    pattern: '/exploitations/:exploitationId/parcelles/:rpgId/detach',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"parcelles"],[1,"rpgId"],[0,"detach"]],
    types: placeholder as Registry['exploitations.detachParcelle']['types'],
  },
  'parcelles.note.update': {
    methods: ["PATCH"],
    pattern: '/exploitations/:exploitationId/parcelles/:rpgId/note',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"parcelles"],[1,"rpgId"],[0,"note"]],
    types: placeholder as Registry['parcelles.note.update']['types'],
  },
  'parcelles.export': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations/:exploitationId/parcelles/export',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"parcelles"],[0,"export"]],
    types: placeholder as Registry['parcelles.export']['types'],
  },
  'exploitations.export': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations/:exploitationId/export',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"export"]],
    types: placeholder as Registry['exploitations.export']['types'],
  },
  'log_entries.index': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations/:exploitationId/journal',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"journal"]],
    types: placeholder as Registry['log_entries.index']['types'],
  },
  'log_entries.export': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations/:exploitationId/journal/export',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"journal"],[0,"export"]],
    types: placeholder as Registry['log_entries.export']['types'],
  },
  'log_entries.get': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations/:exploitationId/journal/:logEntryId',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"journal"],[1,"logEntryId"]],
    types: placeholder as Registry['log_entries.get']['types'],
  },
  'log_entries.edition': {
    methods: ["GET","HEAD"],
    pattern: '/exploitations/:exploitationId/journal/:logEntryId/edition',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"journal"],[1,"logEntryId"],[0,"edition"]],
    types: placeholder as Registry['log_entries.edition']['types'],
  },
  'log_entries.create': {
    methods: ["POST"],
    pattern: '/exploitations/:exploitationId/journal',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"journal"]],
    types: placeholder as Registry['log_entries.create']['types'],
  },
  'log_entries.complete': {
    methods: ["POST"],
    pattern: '/exploitations/:exploitationId/journal/complete',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"journal"],[0,"complete"]],
    types: placeholder as Registry['log_entries.complete']['types'],
  },
  'log_entries.edit': {
    methods: ["PATCH"],
    pattern: '/exploitations/:exploitationId/journal',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"journal"]],
    types: placeholder as Registry['log_entries.edit']['types'],
  },
  'log_entries.destroy': {
    methods: ["DELETE"],
    pattern: '/exploitations/:exploitationId/journal',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"journal"]],
    types: placeholder as Registry['log_entries.destroy']['types'],
  },
  'log_entries.createTagForExploitation': {
    methods: ["POST"],
    pattern: '/exploitations/:exploitationId/tags',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"tags"]],
    types: placeholder as Registry['log_entries.createTagForExploitation']['types'],
  },
  'log_entries.destroyTagForExploitation': {
    methods: ["DELETE"],
    pattern: '/exploitations/:exploitationId/tags',
    tokens: [[0,"exploitations"],[1,"exploitationId"],[0,"tags"]],
    types: placeholder as Registry['log_entries.destroyTagForExploitation']['types'],
  },
  'log_entries.downloadDocument': {
    methods: ["GET","HEAD"],
    pattern: '/journal-document/:documentId',
    tokens: [[0,"journal-document"],[1,"documentId"]],
    types: placeholder as Registry['log_entries.downloadDocument']['types'],
  },
  'log_entries.destroyDocument': {
    methods: ["DELETE"],
    pattern: '/journal-document',
    tokens: [[0,"journal-document"]],
    types: placeholder as Registry['log_entries.destroyDocument']['types'],
  },
  'aac.index': {
    methods: ["GET","HEAD"],
    pattern: '/aac',
    tokens: [[0,"aac"]],
    types: placeholder as Registry['aac.index']['types'],
  },
  'aac.show': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code',
    tokens: [[0,"aac"],[1,"code"]],
    types: placeholder as Registry['aac.show']['types'],
  },
  'aac.analysesSummary': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/analyses/summary',
    tokens: [[0,"aac"],[1,"code"],[0,"analyses"],[0,"summary"]],
    types: placeholder as Registry['aac.analysesSummary']['types'],
  },
  'aac.export.infoGenerale': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/export/general',
    tokens: [[0,"aac"],[1,"code"],[0,"export"],[0,"general"]],
    types: placeholder as Registry['aac.export.infoGenerale']['types'],
  },
  'aac.export.captages': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/export/captages',
    tokens: [[0,"aac"],[1,"code"],[0,"export"],[0,"captages"]],
    types: placeholder as Registry['aac.export.captages']['types'],
  },
  'aac.export.assolement': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/export/assolement',
    tokens: [[0,"aac"],[1,"code"],[0,"export"],[0,"assolement"]],
    types: placeholder as Registry['aac.export.assolement']['types'],
  },
  'aac.export.cultureEvolution': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/export/culture-evolution',
    tokens: [[0,"aac"],[1,"code"],[0,"export"],[0,"culture-evolution"]],
    types: placeholder as Registry['aac.export.cultureEvolution']['types'],
  },
  'aac.export.qualite': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/export/qualite',
    tokens: [[0,"aac"],[1,"code"],[0,"export"],[0,"qualite"]],
    types: placeholder as Registry['aac.export.qualite']['types'],
  },
  'aac.showInstallation': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/installations/:installationCode',
    tokens: [[0,"aac"],[1,"code"],[0,"installations"],[1,"installationCode"]],
    types: placeholder as Registry['aac.showInstallation']['types'],
  },
  'aac.substances': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/installations/:installationCode/analyses/substances',
    tokens: [[0,"aac"],[1,"code"],[0,"installations"],[1,"installationCode"],[0,"analyses"],[0,"substances"]],
    types: placeholder as Registry['aac.substances']['types'],
  },
  'aac.substanceChronique': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/installations/:installationCode/analyses/substances/:codeParametre',
    tokens: [[0,"aac"],[1,"code"],[0,"installations"],[1,"installationCode"],[0,"analyses"],[0,"substances"],[1,"codeParametre"]],
    types: placeholder as Registry['aac.substanceChronique']['types'],
  },
  'aac.analysesPerYear': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/installations/:installationCode/analyses/per-year',
    tokens: [[0,"aac"],[1,"code"],[0,"installations"],[1,"installationCode"],[0,"analyses"],[0,"per-year"]],
    types: placeholder as Registry['aac.analysesPerYear']['types'],
  },
  'aac.analysesYears': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/installations/:installationCode/analyses/years',
    tokens: [[0,"aac"],[1,"code"],[0,"installations"],[1,"installationCode"],[0,"analyses"],[0,"years"]],
    types: placeholder as Registry['aac.analysesYears']['types'],
  },
  'aac.analysesStats': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/installations/:installationCode/analyses/stats',
    tokens: [[0,"aac"],[1,"code"],[0,"installations"],[1,"installationCode"],[0,"analyses"],[0,"stats"]],
    types: placeholder as Registry['aac.analysesStats']['types'],
  },
  'aac.analyses': {
    methods: ["GET","HEAD"],
    pattern: '/aac/:code/installations/:installationCode/analyses',
    tokens: [[0,"aac"],[1,"code"],[0,"installations"],[1,"installationCode"],[0,"analyses"]],
    types: placeholder as Registry['aac.analyses']['types'],
  },
  'projets.index': {
    methods: ["GET","HEAD"],
    pattern: '/projets',
    tokens: [[0,"projets"]],
    types: placeholder as Registry['projets.index']['types'],
  },
  'projets.create': {
    methods: ["GET","HEAD"],
    pattern: '/projets/creation',
    tokens: [[0,"projets"],[0,"creation"]],
    types: placeholder as Registry['projets.create']['types'],
  },
  'projets.edition': {
    methods: ["GET","HEAD"],
    pattern: '/projets/edition/:projectId',
    tokens: [[0,"projets"],[0,"edition"],[1,"projectId"]],
    types: placeholder as Registry['projets.edition']['types'],
  },
  'projets.show': {
    methods: ["GET","HEAD"],
    pattern: '/projets/:projectId',
    tokens: [[0,"projets"],[1,"projectId"]],
    types: placeholder as Registry['projets.show']['types'],
  },
  'projets.store': {
    methods: ["POST"],
    pattern: '/projets',
    tokens: [[0,"projets"]],
    types: placeholder as Registry['projets.store']['types'],
  },
  'projets.update': {
    methods: ["PATCH"],
    pattern: '/projets/:projectId',
    tokens: [[0,"projets"],[1,"projectId"]],
    types: placeholder as Registry['projets.update']['types'],
  },
  'projets.destroy': {
    methods: ["DELETE"],
    pattern: '/projets/:projectId',
    tokens: [[0,"projets"],[1,"projectId"]],
    types: placeholder as Registry['projets.destroy']['types'],
  },
  'projets.exploitations.export': {
    methods: ["GET","HEAD"],
    pattern: '/projets/:projectId/exploitations/export',
    tokens: [[0,"projets"],[1,"projectId"],[0,"exploitations"],[0,"export"]],
    types: placeholder as Registry['projets.exploitations.export']['types'],
  },
  'projets.steps.export': {
    methods: ["GET","HEAD"],
    pattern: '/projets/:projectId/etapes/export',
    tokens: [[0,"projets"],[1,"projectId"],[0,"etapes"],[0,"export"]],
    types: placeholder as Registry['projets.steps.export']['types'],
  },
  'projets.steps.create.form': {
    methods: ["GET","HEAD"],
    pattern: '/projets/:projectId/etapes/creation',
    tokens: [[0,"projets"],[1,"projectId"],[0,"etapes"],[0,"creation"]],
    types: placeholder as Registry['projets.steps.create.form']['types'],
  },
  'projets.steps.get': {
    methods: ["GET","HEAD"],
    pattern: '/projets/:projectId/etapes/:stepId',
    tokens: [[0,"projets"],[1,"projectId"],[0,"etapes"],[1,"stepId"]],
    types: placeholder as Registry['projets.steps.get']['types'],
  },
  'projets.steps.edition': {
    methods: ["GET","HEAD"],
    pattern: '/projets/:projectId/etapes/:stepId/edition',
    tokens: [[0,"projets"],[1,"projectId"],[0,"etapes"],[1,"stepId"],[0,"edition"]],
    types: placeholder as Registry['projets.steps.edition']['types'],
  },
  'projets.steps.create': {
    methods: ["POST"],
    pattern: '/projets/:projectId/etapes',
    tokens: [[0,"projets"],[1,"projectId"],[0,"etapes"]],
    types: placeholder as Registry['projets.steps.create']['types'],
  },
  'projets.steps.complete': {
    methods: ["POST"],
    pattern: '/projets/:projectId/etapes/complete',
    tokens: [[0,"projets"],[1,"projectId"],[0,"etapes"],[0,"complete"]],
    types: placeholder as Registry['projets.steps.complete']['types'],
  },
  'projets.steps.edit': {
    methods: ["PATCH"],
    pattern: '/projets/:projectId/etapes/:stepId',
    tokens: [[0,"projets"],[1,"projectId"],[0,"etapes"],[1,"stepId"]],
    types: placeholder as Registry['projets.steps.edit']['types'],
  },
  'projets.steps.destroy': {
    methods: ["DELETE"],
    pattern: '/projets/:projectId/etapes/:stepId',
    tokens: [[0,"projets"],[1,"projectId"],[0,"etapes"],[1,"stepId"]],
    types: placeholder as Registry['projets.steps.destroy']['types'],
  },
  'projets.steps.documents.download': {
    methods: ["GET","HEAD"],
    pattern: '/projets/:projectId/etapes/:stepId/documents/:documentId',
    tokens: [[0,"projets"],[1,"projectId"],[0,"etapes"],[1,"stepId"],[0,"documents"],[1,"documentId"]],
    types: placeholder as Registry['projets.steps.documents.download']['types'],
  },
  'projets.steps.documents.destroy': {
    methods: ["DELETE"],
    pattern: '/projets/:projectId/etapes/:stepId/documents',
    tokens: [[0,"projets"],[1,"projectId"],[0,"etapes"],[1,"stepId"],[0,"documents"]],
    types: placeholder as Registry['projets.steps.documents.destroy']['types'],
  },
  'projets.steps.tags.create': {
    methods: ["POST"],
    pattern: '/projet-tags',
    tokens: [[0,"projet-tags"]],
    types: placeholder as Registry['projets.steps.tags.create']['types'],
  },
  'projets.steps.tags.destroy': {
    methods: ["DELETE"],
    pattern: '/projet-tags',
    tokens: [[0,"projet-tags"]],
    types: placeholder as Registry['projets.steps.tags.destroy']['types'],
  },
  'territoires.index': {
    methods: ["GET","HEAD"],
    pattern: '/territoires',
    tokens: [[0,"territoires"]],
    types: placeholder as Registry['territoires.index']['types'],
  },
  'recherche.index': {
    methods: ["GET","HEAD"],
    pattern: '/recherche',
    tokens: [[0,"recherche"]],
    types: placeholder as Registry['recherche.index']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
