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

const AccueilController = () => import('#controllers/accueil_controller')
const ExploitationsController = () => import('#controllers/exploitations_controller')
const SessionController = () => import('#controllers/session_controller')
const LogEntriesController = () => import('#controllers/log_entries_controller')
const VisualisationController = () => import('#controllers/visualisation_controller')
const AacController = () => import('#controllers/aac_controller')

router.get('/', ({ response }) => response.redirect('login'))

router.get('login', [SessionController, 'index'])
router.post('login', [SessionController, 'store'])

// Protected routes
router
  .group(() => {
    router.get('logout', [SessionController, 'delete'])
    router.get('pas-de-territoire', [AccueilController, 'noTerritoire']).as('noTerritoire')

    // Routes in this group will redirect to an error page if no territoire is assigned to the user
    router
      .group(() => {
        router.get('accueil', [AccueilController, 'index'])
        router.get('visualisation', [VisualisationController, 'index'])
        router
          .post('visualisation/parcelles', [
            VisualisationController,
            'assignParcellesToExploitation',
          ])
          .as('visualisation.assignParcellesToExploitation')

        router.get('exploitations', [ExploitationsController, 'index']).as('exploitations.index')
        router
          .get('exploitations/creation', [ExploitationsController, 'create'])
          .as('exploitations.create')

        router
          .get('exploitations/edition/:id', [ExploitationsController, 'getForEdition'])
          .as('exploitations.edition')
        router
          .get('exploitations/siret/:siret', [ExploitationsController, 'getBySiret'])
          .as('exploitations.getBySiret')

        router.get('exploitations/:id', [ExploitationsController, 'get']).as('exploitations.get')

        router
          .post('exploitations/creation', [ExploitationsController, 'store'])
          .as('exploitations.store')
        router
          .patch('exploitations/:id', [ExploitationsController, 'edit'])
          .as('exploitations.edit')
        router
          .delete('exploitations/:id', [ExploitationsController, 'destroy'])
          .as('exploitations.destroy')

        router
          .delete('exploitations/:exploitationId/parcelles/:rpgId/detach', [
            ExploitationsController,
            'detachParcelle',
          ])
          .as('exploitations.detachParcelle')

        router
          .patch('exploitations/:exploitationId/parcelles/:rpgId/note', [
            ExploitationsController,
            'updateParcelleNote',
          ])
          .as('parcelles.note.update')

        router
          .get('exploitations/:exploitationId/parcelles/export', [
            ExploitationsController,
            'exportParcellesCsv',
          ])
          .as('parcelles.export')

        router
          .get('exploitations/:exploitationId/export', [
            ExploitationsController,
            'exportExploitationCsv',
          ])
          .as('exploitations.export')

        router
          .get('exploitations/:exploitationId/journal', [LogEntriesController, 'index'])
          .as('log_entries.index')

        router
          .get('exploitations/:exploitationId/journal/export', [LogEntriesController, 'exportCsv'])
          .as('log_entries.export')

        router
          .get('exploitations/:exploitationId/journal/:logEntryId', [LogEntriesController, 'get'])
          .as('log_entries.get')

        router
          .get('exploitations/:exploitationId/journal/:logEntryId/edition', [
            LogEntriesController,
            'getForEdition',
          ])
          .as('log_entries.edition')

        router
          .post('exploitations/:exploitationId/journal', [LogEntriesController, 'create'])
          .as('log_entries.create')
        router
          .post('exploitations/:exploitationId/journal/complete', [
            LogEntriesController,
            'complete',
          ])
          .as('log_entries.complete')
        router
          .patch('exploitations/:exploitationId/journal', [LogEntriesController, 'edit'])
          .as('log_entries.edit')
        router
          .delete('exploitations/:exploitationId/journal', [LogEntriesController, 'destroy'])
          .as('log_entries.destroy')

        router
          .post('exploitations/:exploitationId/tags', [
            LogEntriesController,
            'createTagForExploitation',
          ])
          .as('log_entries.createTagForExploitation')
        router
          .delete('exploitations/:exploitationId/tags', [
            LogEntriesController,
            'destroyTagForExploitation',
          ])
          .as('log_entries.destroyTagForExploitation')

        router
          .get('journal-document/:documentId', [LogEntriesController, 'downloadDocument'])
          .as('log_entries.downloadDocument')
        router
          .delete('journal-document', [LogEntriesController, 'destroyDocument'])
          .as('log_entries.destroyDocument')

        router.get('aac', [AacController, 'index']).as('aac.index')
        router.get('aac/:code', [AacController, 'show']).where('code', /^\d+$/).as('aac.show')
        router
          .get('aac/:code/installations/:installationCode', [AacController, 'showInstallation'])
          .where('code', /^\d+$/)
          .as('aac.showInstallation')
        router
          .get('aac/:code/installations/:installationCode/analyses/substances', [
            AacController,
            'substances',
          ])
          .where('code', /^\d+$/)
          .as('aac.substances')
        router
          .get('aac/:code/installations/:installationCode/analyses/substances/:codeParametre', [
            AacController,
            'substanceChronique',
          ])
          .where('code', /^\d+$/)
          .where('codeParametre', /^\d+$/)
          .as('aac.substanceChronique')
        router
          .get('aac/:code/installations/:installationCode/analyses/per-year', [
            AacController,
            'analysesPerYear',
          ])
          .where('code', /^\d+$/)
          .as('aac.analysesPerYear')
        router
          .get('aac/:code/installations/:installationCode/analyses/years', [
            AacController,
            'analysesYears',
          ])
          .where('code', /^\d+$/)
          .as('aac.analysesYears')
        router
          .get('aac/:code/installations/:installationCode/analyses/stats', [
            AacController,
            'analysesStats',
          ])
          .where('code', /^\d+$/)
          .as('aac.analysesStats')
        router
          .get('aac/:code/installations/:installationCode/analyses', [AacController, 'analyses'])
          .where('code', /^\d+$/)
          .as('aac.analyses')
      })
      .use(middleware.territoireAssignation())
  })
  .use(middleware.auth())
