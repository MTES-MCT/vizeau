/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'root': {
    methods: ['GET', 'HEAD'],
    pattern: '/',
    tokens: [{ old: '/', type: 0, val: '/', end: '' }],
    types: placeholder as Registry['root']['types'],
  },
  'session.index': {
    methods: ['GET', 'HEAD'],
    pattern: '/login',
    tokens: [{ old: '/login', type: 0, val: 'login', end: '' }],
    types: placeholder as Registry['session.index']['types'],
  },
  'session.store': {
    methods: ['POST'],
    pattern: '/login',
    tokens: [{ old: '/login', type: 0, val: 'login', end: '' }],
    types: placeholder as Registry['session.store']['types'],
  },
  'session.delete': {
    methods: ['GET', 'HEAD'],
    pattern: '/logout',
    tokens: [{ old: '/logout', type: 0, val: 'logout', end: '' }],
    types: placeholder as Registry['session.delete']['types'],
  },
  'noTerritoire': {
    methods: ['GET', 'HEAD'],
    pattern: '/pas-de-territoire',
    tokens: [{ old: '/pas-de-territoire', type: 0, val: 'pas-de-territoire', end: '' }],
    types: placeholder as Registry['noTerritoire']['types'],
  },
  'accueil.index': {
    methods: ['GET', 'HEAD'],
    pattern: '/accueil',
    tokens: [{ old: '/accueil', type: 0, val: 'accueil', end: '' }],
    types: placeholder as Registry['accueil.index']['types'],
  },
  'visualisation.index': {
    methods: ['GET', 'HEAD'],
    pattern: '/visualisation',
    tokens: [{ old: '/visualisation', type: 0, val: 'visualisation', end: '' }],
    types: placeholder as Registry['visualisation.index']['types'],
  },
  'visualisation.assignParcellesToExploitation': {
    methods: ['POST'],
    pattern: '/visualisation/parcelles',
    tokens: [
      { old: '/visualisation/parcelles', type: 0, val: 'visualisation', end: '' },
      { old: '/visualisation/parcelles', type: 0, val: 'parcelles', end: '' },
    ],
    types: placeholder as Registry['visualisation.assignParcellesToExploitation']['types'],
  },
  'exploitations.index': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations',
    tokens: [{ old: '/exploitations', type: 0, val: 'exploitations', end: '' }],
    types: placeholder as Registry['exploitations.index']['types'],
  },
  'exploitations.create': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations/creation',
    tokens: [
      { old: '/exploitations/creation', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/creation', type: 0, val: 'creation', end: '' },
    ],
    types: placeholder as Registry['exploitations.create']['types'],
  },
  'exploitations.edition': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations/edition/:id',
    tokens: [
      { old: '/exploitations/edition/:id', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/edition/:id', type: 0, val: 'edition', end: '' },
      { old: '/exploitations/edition/:id', type: 1, val: 'id', end: '' },
    ],
    types: placeholder as Registry['exploitations.edition']['types'],
  },
  'exploitations.getBySiret': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations/siret/:siret',
    tokens: [
      { old: '/exploitations/siret/:siret', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/siret/:siret', type: 0, val: 'siret', end: '' },
      { old: '/exploitations/siret/:siret', type: 1, val: 'siret', end: '' },
    ],
    types: placeholder as Registry['exploitations.getBySiret']['types'],
  },
  'exploitations.get': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations/:id',
    tokens: [
      { old: '/exploitations/:id', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/:id', type: 1, val: 'id', end: '' },
    ],
    types: placeholder as Registry['exploitations.get']['types'],
  },
  'exploitations.store': {
    methods: ['POST'],
    pattern: '/exploitations/creation',
    tokens: [
      { old: '/exploitations/creation', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/creation', type: 0, val: 'creation', end: '' },
    ],
    types: placeholder as Registry['exploitations.store']['types'],
  },
  'exploitations.edit': {
    methods: ['PATCH'],
    pattern: '/exploitations/:id',
    tokens: [
      { old: '/exploitations/:id', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/:id', type: 1, val: 'id', end: '' },
    ],
    types: placeholder as Registry['exploitations.edit']['types'],
  },
  'exploitations.destroy': {
    methods: ['DELETE'],
    pattern: '/exploitations/:id',
    tokens: [
      { old: '/exploitations/:id', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/:id', type: 1, val: 'id', end: '' },
    ],
    types: placeholder as Registry['exploitations.destroy']['types'],
  },
  'exploitations.detachParcelle': {
    methods: ['DELETE'],
    pattern: '/exploitations/:exploitationId/parcelles/:rpgId/detach',
    tokens: [
      {
        old: '/exploitations/:exploitationId/parcelles/:rpgId/detach',
        type: 0,
        val: 'exploitations',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/parcelles/:rpgId/detach',
        type: 1,
        val: 'exploitationId',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/parcelles/:rpgId/detach',
        type: 0,
        val: 'parcelles',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/parcelles/:rpgId/detach',
        type: 1,
        val: 'rpgId',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/parcelles/:rpgId/detach',
        type: 0,
        val: 'detach',
        end: '',
      },
    ],
    types: placeholder as Registry['exploitations.detachParcelle']['types'],
  },
  'parcelles.note.update': {
    methods: ['PATCH'],
    pattern: '/exploitations/:exploitationId/parcelles/:rpgId/note',
    tokens: [
      {
        old: '/exploitations/:exploitationId/parcelles/:rpgId/note',
        type: 0,
        val: 'exploitations',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/parcelles/:rpgId/note',
        type: 1,
        val: 'exploitationId',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/parcelles/:rpgId/note',
        type: 0,
        val: 'parcelles',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/parcelles/:rpgId/note',
        type: 1,
        val: 'rpgId',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/parcelles/:rpgId/note',
        type: 0,
        val: 'note',
        end: '',
      },
    ],
    types: placeholder as Registry['parcelles.note.update']['types'],
  },
  'parcelles.export': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations/:exploitationId/parcelles/export',
    tokens: [
      {
        old: '/exploitations/:exploitationId/parcelles/export',
        type: 0,
        val: 'exploitations',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/parcelles/export',
        type: 1,
        val: 'exploitationId',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/parcelles/export',
        type: 0,
        val: 'parcelles',
        end: '',
      },
      { old: '/exploitations/:exploitationId/parcelles/export', type: 0, val: 'export', end: '' },
    ],
    types: placeholder as Registry['parcelles.export']['types'],
  },
  'exploitations.export': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations/:exploitationId/export',
    tokens: [
      { old: '/exploitations/:exploitationId/export', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/:exploitationId/export', type: 1, val: 'exploitationId', end: '' },
      { old: '/exploitations/:exploitationId/export', type: 0, val: 'export', end: '' },
    ],
    types: placeholder as Registry['exploitations.export']['types'],
  },
  'log_entries.index': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations/:exploitationId/journal',
    tokens: [
      { old: '/exploitations/:exploitationId/journal', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/:exploitationId/journal', type: 1, val: 'exploitationId', end: '' },
      { old: '/exploitations/:exploitationId/journal', type: 0, val: 'journal', end: '' },
    ],
    types: placeholder as Registry['log_entries.index']['types'],
  },
  'log_entries.export': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations/:exploitationId/journal/export',
    tokens: [
      {
        old: '/exploitations/:exploitationId/journal/export',
        type: 0,
        val: 'exploitations',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/journal/export',
        type: 1,
        val: 'exploitationId',
        end: '',
      },
      { old: '/exploitations/:exploitationId/journal/export', type: 0, val: 'journal', end: '' },
      { old: '/exploitations/:exploitationId/journal/export', type: 0, val: 'export', end: '' },
    ],
    types: placeholder as Registry['log_entries.export']['types'],
  },
  'log_entries.get': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations/:exploitationId/journal/:logEntryId',
    tokens: [
      {
        old: '/exploitations/:exploitationId/journal/:logEntryId',
        type: 0,
        val: 'exploitations',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/journal/:logEntryId',
        type: 1,
        val: 'exploitationId',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/journal/:logEntryId',
        type: 0,
        val: 'journal',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/journal/:logEntryId',
        type: 1,
        val: 'logEntryId',
        end: '',
      },
    ],
    types: placeholder as Registry['log_entries.get']['types'],
  },
  'log_entries.edition': {
    methods: ['GET', 'HEAD'],
    pattern: '/exploitations/:exploitationId/journal/:logEntryId/edition',
    tokens: [
      {
        old: '/exploitations/:exploitationId/journal/:logEntryId/edition',
        type: 0,
        val: 'exploitations',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/journal/:logEntryId/edition',
        type: 1,
        val: 'exploitationId',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/journal/:logEntryId/edition',
        type: 0,
        val: 'journal',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/journal/:logEntryId/edition',
        type: 1,
        val: 'logEntryId',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/journal/:logEntryId/edition',
        type: 0,
        val: 'edition',
        end: '',
      },
    ],
    types: placeholder as Registry['log_entries.edition']['types'],
  },
  'log_entries.create': {
    methods: ['POST'],
    pattern: '/exploitations/:exploitationId/journal',
    tokens: [
      { old: '/exploitations/:exploitationId/journal', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/:exploitationId/journal', type: 1, val: 'exploitationId', end: '' },
      { old: '/exploitations/:exploitationId/journal', type: 0, val: 'journal', end: '' },
    ],
    types: placeholder as Registry['log_entries.create']['types'],
  },
  'log_entries.complete': {
    methods: ['POST'],
    pattern: '/exploitations/:exploitationId/journal/complete',
    tokens: [
      {
        old: '/exploitations/:exploitationId/journal/complete',
        type: 0,
        val: 'exploitations',
        end: '',
      },
      {
        old: '/exploitations/:exploitationId/journal/complete',
        type: 1,
        val: 'exploitationId',
        end: '',
      },
      { old: '/exploitations/:exploitationId/journal/complete', type: 0, val: 'journal', end: '' },
      { old: '/exploitations/:exploitationId/journal/complete', type: 0, val: 'complete', end: '' },
    ],
    types: placeholder as Registry['log_entries.complete']['types'],
  },
  'log_entries.edit': {
    methods: ['PATCH'],
    pattern: '/exploitations/:exploitationId/journal',
    tokens: [
      { old: '/exploitations/:exploitationId/journal', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/:exploitationId/journal', type: 1, val: 'exploitationId', end: '' },
      { old: '/exploitations/:exploitationId/journal', type: 0, val: 'journal', end: '' },
    ],
    types: placeholder as Registry['log_entries.edit']['types'],
  },
  'log_entries.destroy': {
    methods: ['DELETE'],
    pattern: '/exploitations/:exploitationId/journal',
    tokens: [
      { old: '/exploitations/:exploitationId/journal', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/:exploitationId/journal', type: 1, val: 'exploitationId', end: '' },
      { old: '/exploitations/:exploitationId/journal', type: 0, val: 'journal', end: '' },
    ],
    types: placeholder as Registry['log_entries.destroy']['types'],
  },
  'log_entries.createTagForExploitation': {
    methods: ['POST'],
    pattern: '/exploitations/:exploitationId/tags',
    tokens: [
      { old: '/exploitations/:exploitationId/tags', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/:exploitationId/tags', type: 1, val: 'exploitationId', end: '' },
      { old: '/exploitations/:exploitationId/tags', type: 0, val: 'tags', end: '' },
    ],
    types: placeholder as Registry['log_entries.createTagForExploitation']['types'],
  },
  'log_entries.destroyTagForExploitation': {
    methods: ['DELETE'],
    pattern: '/exploitations/:exploitationId/tags',
    tokens: [
      { old: '/exploitations/:exploitationId/tags', type: 0, val: 'exploitations', end: '' },
      { old: '/exploitations/:exploitationId/tags', type: 1, val: 'exploitationId', end: '' },
      { old: '/exploitations/:exploitationId/tags', type: 0, val: 'tags', end: '' },
    ],
    types: placeholder as Registry['log_entries.destroyTagForExploitation']['types'],
  },
  'log_entries.downloadDocument': {
    methods: ['GET', 'HEAD'],
    pattern: '/journal-document/:documentId',
    tokens: [
      { old: '/journal-document/:documentId', type: 0, val: 'journal-document', end: '' },
      { old: '/journal-document/:documentId', type: 1, val: 'documentId', end: '' },
    ],
    types: placeholder as Registry['log_entries.downloadDocument']['types'],
  },
  'log_entries.destroyDocument': {
    methods: ['DELETE'],
    pattern: '/journal-document',
    tokens: [{ old: '/journal-document', type: 0, val: 'journal-document', end: '' }],
    types: placeholder as Registry['log_entries.destroyDocument']['types'],
  },
  'aac.index': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac',
    tokens: [{ old: '/aac', type: 0, val: 'aac', end: '' }],
    types: placeholder as Registry['aac.index']['types'],
  },
  'aac.show': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code',
    tokens: [
      { old: '/aac/:code', type: 0, val: 'aac', end: '' },
      { old: '/aac/:code', type: 1, val: 'code', end: '' },
    ],
    types: placeholder as Registry['aac.show']['types'],
  },
  'aac.analysesSummary': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/analyses/summary',
    tokens: [
      { old: '/aac/:code/analyses/summary', type: 0, val: 'aac', end: '' },
      { old: '/aac/:code/analyses/summary', type: 1, val: 'code', end: '' },
      { old: '/aac/:code/analyses/summary', type: 0, val: 'analyses', end: '' },
      { old: '/aac/:code/analyses/summary', type: 0, val: 'summary', end: '' },
    ],
    types: placeholder as Registry['aac.analysesSummary']['types'],
  },
  'aac.export.infoGenerale': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/export/general',
    tokens: [
      { old: '/aac/:code/export/general', type: 0, val: 'aac', end: '' },
      { old: '/aac/:code/export/general', type: 1, val: 'code', end: '' },
      { old: '/aac/:code/export/general', type: 0, val: 'export', end: '' },
      { old: '/aac/:code/export/general', type: 0, val: 'general', end: '' },
    ],
    types: placeholder as Registry['aac.export.infoGenerale']['types'],
  },
  'aac.export.captages': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/export/captages',
    tokens: [
      { old: '/aac/:code/export/captages', type: 0, val: 'aac', end: '' },
      { old: '/aac/:code/export/captages', type: 1, val: 'code', end: '' },
      { old: '/aac/:code/export/captages', type: 0, val: 'export', end: '' },
      { old: '/aac/:code/export/captages', type: 0, val: 'captages', end: '' },
    ],
    types: placeholder as Registry['aac.export.captages']['types'],
  },
  'aac.export.assolement': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/export/assolement',
    tokens: [
      { old: '/aac/:code/export/assolement', type: 0, val: 'aac', end: '' },
      { old: '/aac/:code/export/assolement', type: 1, val: 'code', end: '' },
      { old: '/aac/:code/export/assolement', type: 0, val: 'export', end: '' },
      { old: '/aac/:code/export/assolement', type: 0, val: 'assolement', end: '' },
    ],
    types: placeholder as Registry['aac.export.assolement']['types'],
  },
  'aac.export.cultureEvolution': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/export/culture-evolution',
    tokens: [
      { old: '/aac/:code/export/culture-evolution', type: 0, val: 'aac', end: '' },
      { old: '/aac/:code/export/culture-evolution', type: 1, val: 'code', end: '' },
      { old: '/aac/:code/export/culture-evolution', type: 0, val: 'export', end: '' },
      { old: '/aac/:code/export/culture-evolution', type: 0, val: 'culture-evolution', end: '' },
    ],
    types: placeholder as Registry['aac.export.cultureEvolution']['types'],
  },
  'aac.export.qualite': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/export/qualite',
    tokens: [
      { old: '/aac/:code/export/qualite', type: 0, val: 'aac', end: '' },
      { old: '/aac/:code/export/qualite', type: 1, val: 'code', end: '' },
      { old: '/aac/:code/export/qualite', type: 0, val: 'export', end: '' },
      { old: '/aac/:code/export/qualite', type: 0, val: 'qualite', end: '' },
    ],
    types: placeholder as Registry['aac.export.qualite']['types'],
  },
  'aac.showInstallation': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/installations/:installationCode',
    tokens: [
      { old: '/aac/:code/installations/:installationCode', type: 0, val: 'aac', end: '' },
      { old: '/aac/:code/installations/:installationCode', type: 1, val: 'code', end: '' },
      { old: '/aac/:code/installations/:installationCode', type: 0, val: 'installations', end: '' },
      {
        old: '/aac/:code/installations/:installationCode',
        type: 1,
        val: 'installationCode',
        end: '',
      },
    ],
    types: placeholder as Registry['aac.showInstallation']['types'],
  },
  'aac.substances': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/installations/:installationCode/analyses/substances',
    tokens: [
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances',
        type: 0,
        val: 'aac',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances',
        type: 1,
        val: 'code',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances',
        type: 0,
        val: 'installations',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances',
        type: 1,
        val: 'installationCode',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances',
        type: 0,
        val: 'analyses',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances',
        type: 0,
        val: 'substances',
        end: '',
      },
    ],
    types: placeholder as Registry['aac.substances']['types'],
  },
  'aac.substanceChronique': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/installations/:installationCode/analyses/substances/:codeParametre',
    tokens: [
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances/:codeParametre',
        type: 0,
        val: 'aac',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances/:codeParametre',
        type: 1,
        val: 'code',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances/:codeParametre',
        type: 0,
        val: 'installations',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances/:codeParametre',
        type: 1,
        val: 'installationCode',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances/:codeParametre',
        type: 0,
        val: 'analyses',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances/:codeParametre',
        type: 0,
        val: 'substances',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/substances/:codeParametre',
        type: 1,
        val: 'codeParametre',
        end: '',
      },
    ],
    types: placeholder as Registry['aac.substanceChronique']['types'],
  },
  'aac.analysesPerYear': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/installations/:installationCode/analyses/per-year',
    tokens: [
      {
        old: '/aac/:code/installations/:installationCode/analyses/per-year',
        type: 0,
        val: 'aac',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/per-year',
        type: 1,
        val: 'code',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/per-year',
        type: 0,
        val: 'installations',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/per-year',
        type: 1,
        val: 'installationCode',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/per-year',
        type: 0,
        val: 'analyses',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/per-year',
        type: 0,
        val: 'per-year',
        end: '',
      },
    ],
    types: placeholder as Registry['aac.analysesPerYear']['types'],
  },
  'aac.analysesYears': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/installations/:installationCode/analyses/years',
    tokens: [
      {
        old: '/aac/:code/installations/:installationCode/analyses/years',
        type: 0,
        val: 'aac',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/years',
        type: 1,
        val: 'code',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/years',
        type: 0,
        val: 'installations',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/years',
        type: 1,
        val: 'installationCode',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/years',
        type: 0,
        val: 'analyses',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/years',
        type: 0,
        val: 'years',
        end: '',
      },
    ],
    types: placeholder as Registry['aac.analysesYears']['types'],
  },
  'aac.analysesStats': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/installations/:installationCode/analyses/stats',
    tokens: [
      {
        old: '/aac/:code/installations/:installationCode/analyses/stats',
        type: 0,
        val: 'aac',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/stats',
        type: 1,
        val: 'code',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/stats',
        type: 0,
        val: 'installations',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/stats',
        type: 1,
        val: 'installationCode',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/stats',
        type: 0,
        val: 'analyses',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses/stats',
        type: 0,
        val: 'stats',
        end: '',
      },
    ],
    types: placeholder as Registry['aac.analysesStats']['types'],
  },
  'aac.analyses': {
    methods: ['GET', 'HEAD'],
    pattern: '/aac/:code/installations/:installationCode/analyses',
    tokens: [
      { old: '/aac/:code/installations/:installationCode/analyses', type: 0, val: 'aac', end: '' },
      { old: '/aac/:code/installations/:installationCode/analyses', type: 1, val: 'code', end: '' },
      {
        old: '/aac/:code/installations/:installationCode/analyses',
        type: 0,
        val: 'installations',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses',
        type: 1,
        val: 'installationCode',
        end: '',
      },
      {
        old: '/aac/:code/installations/:installationCode/analyses',
        type: 0,
        val: 'analyses',
        end: '',
      },
    ],
    types: placeholder as Registry['aac.analyses']['types'],
  },
  'projets.index': {
    methods: ['GET', 'HEAD'],
    pattern: '/projets',
    tokens: [{ old: '/projets', type: 0, val: 'projets', end: '' }],
    types: placeholder as Registry['projets.index']['types'],
  },
  'projets.create': {
    methods: ['GET', 'HEAD'],
    pattern: '/projets/creation',
    tokens: [
      { old: '/projets/creation', type: 0, val: 'projets', end: '' },
      { old: '/projets/creation', type: 0, val: 'creation', end: '' },
    ],
    types: placeholder as Registry['projets.create']['types'],
  },
  'projets.edition': {
    methods: ['GET', 'HEAD'],
    pattern: '/projets/edition/:projectId',
    tokens: [
      { old: '/projets/edition/:projectId', type: 0, val: 'projets', end: '' },
      { old: '/projets/edition/:projectId', type: 0, val: 'edition', end: '' },
      { old: '/projets/edition/:projectId', type: 1, val: 'projectId', end: '' },
    ],
    types: placeholder as Registry['projets.edition']['types'],
  },
  'projets.show': {
    methods: ['GET', 'HEAD'],
    pattern: '/projets/:projectId',
    tokens: [
      { old: '/projets/:projectId', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId', type: 1, val: 'projectId', end: '' },
    ],
    types: placeholder as Registry['projets.show']['types'],
  },
  'projets.store': {
    methods: ['POST'],
    pattern: '/projets',
    tokens: [{ old: '/projets', type: 0, val: 'projets', end: '' }],
    types: placeholder as Registry['projets.store']['types'],
  },
  'projets.update': {
    methods: ['PATCH'],
    pattern: '/projets/:projectId',
    tokens: [
      { old: '/projets/:projectId', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId', type: 1, val: 'projectId', end: '' },
    ],
    types: placeholder as Registry['projets.update']['types'],
  },
  'projets.destroy': {
    methods: ['DELETE'],
    pattern: '/projets/:projectId',
    tokens: [
      { old: '/projets/:projectId', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId', type: 1, val: 'projectId', end: '' },
    ],
    types: placeholder as Registry['projets.destroy']['types'],
  },
  'projets.steps.create.form': {
    methods: ['GET', 'HEAD'],
    pattern: '/projets/:projectId/etapes/creation',
    tokens: [
      { old: '/projets/:projectId/etapes/creation', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId/etapes/creation', type: 1, val: 'projectId', end: '' },
      { old: '/projets/:projectId/etapes/creation', type: 0, val: 'etapes', end: '' },
      { old: '/projets/:projectId/etapes/creation', type: 0, val: 'creation', end: '' },
    ],
    types: placeholder as Registry['projets.steps.create.form']['types'],
  },
  'projets.steps.get': {
    methods: ['GET', 'HEAD'],
    pattern: '/projets/:projectId/etapes/:stepId',
    tokens: [
      { old: '/projets/:projectId/etapes/:stepId', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId/etapes/:stepId', type: 1, val: 'projectId', end: '' },
      { old: '/projets/:projectId/etapes/:stepId', type: 0, val: 'etapes', end: '' },
      { old: '/projets/:projectId/etapes/:stepId', type: 1, val: 'stepId', end: '' },
    ],
    types: placeholder as Registry['projets.steps.get']['types'],
  },
  'projets.steps.edition': {
    methods: ['GET', 'HEAD'],
    pattern: '/projets/:projectId/etapes/:stepId/edition',
    tokens: [
      { old: '/projets/:projectId/etapes/:stepId/edition', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId/etapes/:stepId/edition', type: 1, val: 'projectId', end: '' },
      { old: '/projets/:projectId/etapes/:stepId/edition', type: 0, val: 'etapes', end: '' },
      { old: '/projets/:projectId/etapes/:stepId/edition', type: 1, val: 'stepId', end: '' },
      { old: '/projets/:projectId/etapes/:stepId/edition', type: 0, val: 'edition', end: '' },
    ],
    types: placeholder as Registry['projets.steps.edition']['types'],
  },
  'projets.steps.create': {
    methods: ['POST'],
    pattern: '/projets/:projectId/etapes',
    tokens: [
      { old: '/projets/:projectId/etapes', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId/etapes', type: 1, val: 'projectId', end: '' },
      { old: '/projets/:projectId/etapes', type: 0, val: 'etapes', end: '' },
    ],
    types: placeholder as Registry['projets.steps.create']['types'],
  },
  'projets.steps.complete': {
    methods: ['POST'],
    pattern: '/projets/:projectId/etapes/complete',
    tokens: [
      { old: '/projets/:projectId/etapes/complete', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId/etapes/complete', type: 1, val: 'projectId', end: '' },
      { old: '/projets/:projectId/etapes/complete', type: 0, val: 'etapes', end: '' },
      { old: '/projets/:projectId/etapes/complete', type: 0, val: 'complete', end: '' },
    ],
    types: placeholder as Registry['projets.steps.complete']['types'],
  },
  'projets.steps.edit': {
    methods: ['PATCH'],
    pattern: '/projets/:projectId/etapes/:stepId',
    tokens: [
      { old: '/projets/:projectId/etapes/:stepId', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId/etapes/:stepId', type: 1, val: 'projectId', end: '' },
      { old: '/projets/:projectId/etapes/:stepId', type: 0, val: 'etapes', end: '' },
      { old: '/projets/:projectId/etapes/:stepId', type: 1, val: 'stepId', end: '' },
    ],
    types: placeholder as Registry['projets.steps.edit']['types'],
  },
  'projets.steps.destroy': {
    methods: ['DELETE'],
    pattern: '/projets/:projectId/etapes/:stepId',
    tokens: [
      { old: '/projets/:projectId/etapes/:stepId', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId/etapes/:stepId', type: 1, val: 'projectId', end: '' },
      { old: '/projets/:projectId/etapes/:stepId', type: 0, val: 'etapes', end: '' },
      { old: '/projets/:projectId/etapes/:stepId', type: 1, val: 'stepId', end: '' },
    ],
    types: placeholder as Registry['projets.steps.destroy']['types'],
  },
  'projets.steps.documents.download': {
    methods: ['GET', 'HEAD'],
    pattern: '/projets/:projectId/etapes/:stepId/documents/:documentId',
    tokens: [
      {
        old: '/projets/:projectId/etapes/:stepId/documents/:documentId',
        type: 0,
        val: 'projets',
        end: '',
      },
      {
        old: '/projets/:projectId/etapes/:stepId/documents/:documentId',
        type: 1,
        val: 'projectId',
        end: '',
      },
      {
        old: '/projets/:projectId/etapes/:stepId/documents/:documentId',
        type: 0,
        val: 'etapes',
        end: '',
      },
      {
        old: '/projets/:projectId/etapes/:stepId/documents/:documentId',
        type: 1,
        val: 'stepId',
        end: '',
      },
      {
        old: '/projets/:projectId/etapes/:stepId/documents/:documentId',
        type: 0,
        val: 'documents',
        end: '',
      },
      {
        old: '/projets/:projectId/etapes/:stepId/documents/:documentId',
        type: 1,
        val: 'documentId',
        end: '',
      },
    ],
    types: placeholder as Registry['projets.steps.documents.download']['types'],
  },
  'projets.steps.documents.destroy': {
    methods: ['DELETE'],
    pattern: '/projets/:projectId/etapes/:stepId/documents',
    tokens: [
      { old: '/projets/:projectId/etapes/:stepId/documents', type: 0, val: 'projets', end: '' },
      { old: '/projets/:projectId/etapes/:stepId/documents', type: 1, val: 'projectId', end: '' },
      { old: '/projets/:projectId/etapes/:stepId/documents', type: 0, val: 'etapes', end: '' },
      { old: '/projets/:projectId/etapes/:stepId/documents', type: 1, val: 'stepId', end: '' },
      { old: '/projets/:projectId/etapes/:stepId/documents', type: 0, val: 'documents', end: '' },
    ],
    types: placeholder as Registry['projets.steps.documents.destroy']['types'],
  },
  'projets.steps.tags.create': {
    methods: ['POST'],
    pattern: '/projet-tags',
    tokens: [{ old: '/projet-tags', type: 0, val: 'projet-tags', end: '' }],
    types: placeholder as Registry['projets.steps.tags.create']['types'],
  },
  'projets.steps.tags.destroy': {
    methods: ['DELETE'],
    pattern: '/projet-tags',
    tokens: [{ old: '/projet-tags', type: 0, val: 'projet-tags', end: '' }],
    types: placeholder as Registry['projets.steps.tags.destroy']['types'],
  },
  'territoires.index': {
    methods: ['GET', 'HEAD'],
    pattern: '/territoires',
    tokens: [{ old: '/territoires', type: 0, val: 'territoires', end: '' }],
    types: placeholder as Registry['territoires.index']['types'],
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
