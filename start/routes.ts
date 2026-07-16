/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

import { controllers } from '#generated/controllers'

router.get('/', ({ response }) => response.redirect('login')).as('root')

router.get('login', [controllers.Session, 'index'])
router.post('login', [controllers.Session, 'store'])

// Protected routes
router
  .group(() => {
    router.get('logout', [controllers.Session, 'delete'])
    router.get('pas-de-territoire', [controllers.Accueil, 'noTerritoire']).as('noTerritoire')

    // Routes in this group will redirect to an error page if no territoire is assigned to the user
    router
      .group(() => {
        router.get('accueil', [controllers.Accueil, 'index'])
        router.get('visualisation', [controllers.Visualisation, 'index'])
        router
          .post('visualisation/parcelles', [
            controllers.Visualisation,
            'assignParcellesToExploitation',
          ])
          .as('visualisation.assignParcellesToExploitation')

        router.get('exploitations', [controllers.Exploitations, 'index']).as('exploitations.index')
        router
          .get('exploitations/creation', [controllers.Exploitations, 'create'])
          .as('exploitations.create')

        router
          .get('exploitations/edition/:id', [controllers.Exploitations, 'getForEdition'])
          .as('exploitations.edition')
        router
          .get('exploitations/siret/:siret', [controllers.Exploitations, 'getBySiret'])
          .as('exploitations.getBySiret')

        router.get('exploitations/:id', [controllers.Exploitations, 'get']).as('exploitations.get')

        router
          .post('exploitations/creation', [controllers.Exploitations, 'store'])
          .as('exploitations.store')
        router
          .patch('exploitations/:id', [controllers.Exploitations, 'edit'])
          .as('exploitations.edit')
        router
          .delete('exploitations/:id', [controllers.Exploitations, 'destroy'])
          .as('exploitations.destroy')

        router
          .delete('exploitations/:exploitationId/parcelles/:rpgId/detach', [
            controllers.Exploitations,
            'detachParcelle',
          ])
          .as('exploitations.detachParcelle')

        router
          .patch('exploitations/:exploitationId/parcelles/:rpgId/note', [
            controllers.Exploitations,
            'updateParcelleNote',
          ])
          .as('parcelles.note.update')

        router
          .get('exploitations/:exploitationId/parcelles/export', [
            controllers.Exploitations,
            'exportParcellesCsv',
          ])
          .as('parcelles.export')

        router
          .get('exploitations/:exploitationId/export', [
            controllers.Exploitations,
            'exportExploitationCsv',
          ])
          .as('exploitations.export')

        router
          .get('exploitations/:exploitationId/journal', [controllers.LogEntries, 'index'])
          .as('log_entries.index')

        router
          .get('exploitations/:exploitationId/journal/export', [
            controllers.LogEntries,
            'exportCsv',
          ])
          .as('log_entries.export')

        router
          .get('exploitations/:exploitationId/journal/:logEntryId', [controllers.LogEntries, 'get'])
          .as('log_entries.get')

        router
          .get('exploitations/:exploitationId/journal/:logEntryId/edition', [
            controllers.LogEntries,
            'getForEdition',
          ])
          .as('log_entries.edition')

        router
          .post('exploitations/:exploitationId/journal', [controllers.LogEntries, 'create'])
          .as('log_entries.create')
        router
          .post('exploitations/:exploitationId/journal/complete', [
            controllers.LogEntries,
            'complete',
          ])
          .as('log_entries.complete')
        router
          .patch('exploitations/:exploitationId/journal', [controllers.LogEntries, 'edit'])
          .as('log_entries.edit')
        router
          .delete('exploitations/:exploitationId/journal', [controllers.LogEntries, 'destroy'])
          .as('log_entries.destroy')

        router
          .post('exploitations/:exploitationId/tags', [
            controllers.LogEntries,
            'createTagForExploitation',
          ])
          .as('log_entries.createTagForExploitation')
        router
          .delete('exploitations/:exploitationId/tags', [
            controllers.LogEntries,
            'destroyTagForExploitation',
          ])
          .as('log_entries.destroyTagForExploitation')

        router
          .get('journal-document/:documentId', [controllers.LogEntries, 'downloadDocument'])
          .as('log_entries.downloadDocument')
        router
          .delete('journal-document', [controllers.LogEntries, 'destroyDocument'])
          .as('log_entries.destroyDocument')

        router.get('aac', [controllers.Aac, 'index']).as('aac.index')
        router.get('aac/:code', [controllers.Aac, 'show']).where('code', /^\d+$/).as('aac.show')
        router
          .get('aac/:code/analyses/summary', [controllers.Aac, 'analysesSummary'])
          .where('code', /^\d+$/)
          .as('aac.analysesSummary')
        router
          .get('aac/:code/export/general', [controllers.Aac, 'exportInfoGenerale'])
          .where('code', /^\d+$/)
          .as('aac.export.infoGenerale')
        router
          .get('aac/:code/export/captages', [controllers.Aac, 'exportCaptages'])
          .where('code', /^\d+$/)
          .as('aac.export.captages')
        router
          .get('aac/:code/export/assolement', [controllers.Aac, 'exportAssolement'])
          .where('code', /^\d+$/)
          .as('aac.export.assolement')
        router
          .get('aac/:code/export/culture-evolution', [controllers.Aac, 'exportCultureEvolution'])
          .where('code', /^\d+$/)
          .as('aac.export.cultureEvolution')
        router
          .get('aac/:code/export/qualite', [controllers.Aac, 'exportQualiteEau'])
          .where('code', /^\d+$/)
          .as('aac.export.qualite')
        router
          .get('aac/:code/installations/:installationCode', [controllers.Aac, 'showInstallation'])
          .where('code', /^\d+$/)
          .as('aac.showInstallation')
        router
          .get('aac/:code/installations/:installationCode/analyses/substances', [
            controllers.Aac,
            'substances',
          ])
          .where('code', /^\d+$/)
          .as('aac.substances')
        router
          .get('aac/:code/installations/:installationCode/analyses/substances/:codeParametre', [
            controllers.Aac,
            'substanceChronique',
          ])
          .where('code', /^\d+$/)
          .where('codeParametre', /^\d+$/)
          .as('aac.substanceChronique')
        router
          .get('aac/:code/installations/:installationCode/analyses/per-year', [
            controllers.Aac,
            'analysesPerYear',
          ])
          .where('code', /^\d+$/)
          .as('aac.analysesPerYear')
        router
          .get('aac/:code/installations/:installationCode/analyses/years', [
            controllers.Aac,
            'analysesYears',
          ])
          .where('code', /^\d+$/)
          .as('aac.analysesYears')
        router
          .get('aac/:code/installations/:installationCode/analyses/stats', [
            controllers.Aac,
            'analysesStats',
          ])
          .where('code', /^\d+$/)
          .as('aac.analysesStats')
        router
          .get('aac/:code/installations/:installationCode/analyses', [controllers.Aac, 'analyses'])
          .where('code', /^\d+$/)
          .as('aac.analyses')

        router.get('projets', [controllers.Projects, 'index']).as('projets.index')
        router.get('projets/creation', [controllers.Projects, 'create']).as('projets.create')
        router
          .get('projets/edition/:projectId', [controllers.Projects, 'getForEdition'])
          .as('projets.edition')
        router.get('projets/:projectId', [controllers.Projects, 'show']).as('projets.show')
        router.post('projets', [controllers.Projects, 'store']).as('projets.store')
        router.patch('projets/:projectId', [controllers.Projects, 'update']).as('projets.update')
        router.delete('projets/:projectId', [controllers.Projects, 'destroy']).as('projets.destroy')
        router
          .get('projets/:projectId/etapes/creation', [controllers.ProjectSteps, 'createStepForm'])
          .as('projets.steps.create.form')
        router
          .get('projets/:projectId/etapes/:stepId', [controllers.ProjectSteps, 'getStep'])
          .as('projets.steps.get')
        router
          .get('projets/:projectId/etapes/:stepId/edition', [
            controllers.ProjectSteps,
            'getStepForEdition',
          ])
          .as('projets.steps.edition')
        router
          .post('projets/:projectId/etapes', [controllers.ProjectSteps, 'createStep'])
          .as('projets.steps.create')
        router
          .post('projets/:projectId/etapes/complete', [controllers.ProjectSteps, 'completeStep'])
          .as('projets.steps.complete')
        router
          .patch('projets/:projectId/etapes/:stepId', [controllers.ProjectSteps, 'editStep'])
          .as('projets.steps.edit')
        router
          .delete('projets/:projectId/etapes/:stepId', [controllers.ProjectSteps, 'destroyStep'])
          .as('projets.steps.destroy')
        router
          .get('projets/:projectId/etapes/:stepId/documents/:documentId', [
            controllers.ProjectSteps,
            'downloadStepDocument',
          ])
          .as('projets.steps.documents.download')
        router
          .delete('projets/:projectId/etapes/:stepId/documents', [
            controllers.ProjectSteps,
            'destroyDocument',
          ])
          .as('projets.steps.documents.destroy')
        router
          .post('projet-tags', [controllers.ProjectSteps, 'createTag'])
          .as('projets.steps.tags.create')
        router
          .delete('projet-tags', [controllers.ProjectSteps, 'destroyTag'])
          .as('projets.steps.tags.destroy')

        router.get('territoires', [controllers.Territoires, 'index']).as('territoires.index')
      })
      .use(middleware.territoireAssignation())
  })
  .use(middleware.auth())
