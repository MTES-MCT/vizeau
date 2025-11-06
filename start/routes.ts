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

router.get('/', ({ response }) => response.redirect('login'))

router.get('login', [SessionController, 'index'])
router.post('login', [SessionController, 'store'])

// Protected routes
router
  .group(() => {
    router.get('logout', [SessionController, 'delete'])

    router.get('accueil', [AccueilController, 'index'])
    router.get('exploitations', [ExploitationsController, 'index']).as('exploitations.index')

    router.post('exploitations', [ExploitationsController, 'store']).as('exploitations.store')
    router.patch('exploitations/:id', [ExploitationsController, 'edit']).as('exploitations.edit')
  })
  .use(middleware.auth())
