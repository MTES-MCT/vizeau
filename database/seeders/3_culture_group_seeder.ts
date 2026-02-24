import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CultureGroup from '#models/culture_group'

export default class CultureGroupSeeder extends BaseSeeder {
  public async run() {
    const groups: Array<{ code: string; label: string }> = [
      { code: '1', label: 'Blé tendre' },
      { code: '2', label: 'Maïs grain et ensilage' },
      { code: '3', label: 'Orge' },
      { code: '4', label: 'Autres céréales' },
      { code: '5', label: 'Colza' },
      { code: '6', label: 'Tournesol' },
      { code: '7', label: 'Autres oléagineux' },
      { code: '8', label: 'Protéagineux' },
      { code: '9', label: 'Plantes à fibres' },
      { code: '11', label: 'Gel (surfaces gelées sans production)' },
      { code: '14', label: 'Riz' },
      { code: '15', label: 'Légumineuses à grains' },
      { code: '16', label: 'Fourrage' },
      { code: '17', label: 'Estives et landes' },
      { code: '18', label: 'Prairies permanentes' },
      { code: '19', label: 'Prairies temporaires' },
      { code: '20', label: 'Vergers' },
      { code: '21', label: 'Vignes' },
      { code: '22', label: 'Fruits à coque' },
      { code: '23', label: 'Oliviers' },
      { code: '24', label: 'Autres cultures industrielles' },
      { code: '25', label: 'Légumes ou fleurs' },
      { code: '26', label: 'Canne à sucre' },
      { code: '28', label: 'Divers' },
    ]

    await CultureGroup.updateOrCreateMany('code', groups)
  }
}
