/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  root: typeof routes['root']
  session: {
    index: typeof routes['session.index']
    store: typeof routes['session.store']
    delete: typeof routes['session.delete']
  }
  noTerritoire: typeof routes['noTerritoire']
  accueil: typeof routes['accueil']
  visualisation: {
    index: typeof routes['visualisation.index']
    assignParcellesToExploitation: typeof routes['visualisation.assignParcellesToExploitation']
  }
  exploitations: {
    index: typeof routes['exploitations.index']
    create: typeof routes['exploitations.create']
    edition: typeof routes['exploitations.edition']
    getBySiret: typeof routes['exploitations.getBySiret']
    get: typeof routes['exploitations.get']
    store: typeof routes['exploitations.store']
    edit: typeof routes['exploitations.edit']
    destroy: typeof routes['exploitations.destroy']
    detachParcelle: typeof routes['exploitations.detachParcelle']
    export: typeof routes['exploitations.export']
  }
  parcelles: {
    note: {
      update: typeof routes['parcelles.note.update']
    }
    export: typeof routes['parcelles.export']
  }
  logEntries: {
    index: typeof routes['log_entries.index']
    export: typeof routes['log_entries.export']
    get: typeof routes['log_entries.get']
    edition: typeof routes['log_entries.edition']
    create: typeof routes['log_entries.create']
    complete: typeof routes['log_entries.complete']
    edit: typeof routes['log_entries.edit']
    destroy: typeof routes['log_entries.destroy']
    createTagForExploitation: typeof routes['log_entries.createTagForExploitation']
    destroyTagForExploitation: typeof routes['log_entries.destroyTagForExploitation']
    downloadDocument: typeof routes['log_entries.downloadDocument']
    destroyDocument: typeof routes['log_entries.destroyDocument']
  }
  aac: {
    index: typeof routes['aac.index']
    show: typeof routes['aac.show']
    analysesSummary: typeof routes['aac.analysesSummary']
    export: {
      infoGenerale: typeof routes['aac.export.infoGenerale']
      captages: typeof routes['aac.export.captages']
      assolement: typeof routes['aac.export.assolement']
      cultureEvolution: typeof routes['aac.export.cultureEvolution']
      qualite: typeof routes['aac.export.qualite']
    }
    showInstallation: typeof routes['aac.showInstallation']
    substances: typeof routes['aac.substances']
    substanceChronique: typeof routes['aac.substanceChronique']
    analysesPerYear: typeof routes['aac.analysesPerYear']
    analysesYears: typeof routes['aac.analysesYears']
    analysesStats: typeof routes['aac.analysesStats']
    analyses: typeof routes['aac.analyses']
  }
  projets: {
    index: typeof routes['projets.index']
    create: typeof routes['projets.create']
    edition: typeof routes['projets.edition']
    show: typeof routes['projets.show']
    store: typeof routes['projets.store']
    update: typeof routes['projets.update']
    destroy: typeof routes['projets.destroy']
    steps: {
      create: typeof routes['projets.steps.create'] & {
        form: typeof routes['projets.steps.create.form']
      }
      get: typeof routes['projets.steps.get']
      edition: typeof routes['projets.steps.edition']
      complete: typeof routes['projets.steps.complete']
      edit: typeof routes['projets.steps.edit']
      destroy: typeof routes['projets.steps.destroy']
      documents: {
        download: typeof routes['projets.steps.documents.download']
        destroy: typeof routes['projets.steps.documents.destroy']
      }
      tags: {
        create: typeof routes['projets.steps.tags.create']
        destroy: typeof routes['projets.steps.tags.destroy']
      }
    }
  }
  territoires: {
    index: typeof routes['territoires.index']
  }
}
