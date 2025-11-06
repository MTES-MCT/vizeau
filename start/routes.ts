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

    router.get('exploitations', [ExploitationsController, 'index'])
    router.get('accueil', [AccueilController, 'index'])
  })
  .use(middleware.auth())
