import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/limiter'

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE', 'database'),
  stores: {
    // Compteurs partagés entre les conteneurs, stockés dans PostgreSQL
    database: stores.database({
      tableName: 'rate_limits',
    }),

    // Utilisé pendant les tests
    memory: stores.memory({}),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
