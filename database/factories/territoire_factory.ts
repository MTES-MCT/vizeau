import factory from '@adonisjs/lucid/factories'
import Territoire from '#models/territoire'

export const TerritoireFactory = factory
  .define(Territoire, async () => {
    return {
      name: 'Territoire par défaut',
    }
  })
  .build()
