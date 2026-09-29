import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import ProjectStep from '#models/project_step'
import { AacService } from '#services/aac_service'
import { ExploitationService } from '#services/exploitation_service'
import { LogEntryService } from '#services/log_entry_service'
import { ProjectService } from '#services/project_service'

// Nombre maximum de résultats renvoyés par thématique
export const GLOBAL_SEARCH_LIMIT = 5

type SearchResult<T> = { data: T[]; total: number }

/**
 * Renvoie les `GLOBAL_SEARCH_LIMIT` premiers résultats de la requête, ainsi que leur nombre total.
 */
async function fetchWithTotal<Model extends LucidModel>(
  query: ModelQueryBuilderContract<Model>,
  prepareDataQuery: (
    dataQuery: ModelQueryBuilderContract<Model>
  ) => ModelQueryBuilderContract<Model>
): Promise<SearchResult<InstanceType<Model>>> {
  const [countResult, data] = await Promise.all([
    query.clone().count('* as total').first(),
    prepareDataQuery(query.clone()).limit(GLOBAL_SEARCH_LIMIT),
  ])

  return { data, total: Number(countResult?.$extras.total ?? 0) }
}

/**
 * Les résultats AAC et points de prélèvement proviennent du jeu de données AAC (DuckDB sur S3) :
 * si la source distante est indisponible, on renvoie ces thématiques vides plutôt que de faire
 * échouer toute la recherche.
 */
async function withAacFallback<T>(label: string, query: () => Promise<SearchResult<T>>) {
  try {
    return await query()
  } catch (error) {
    logger.error({ err: error }, `Données AAC indisponibles (recherche générale : ${label})`)
    return { data: [], total: 0 } as SearchResult<T>
  }
}

/**
 * Recherche générale : interroge chaque thématique en parallèle, dans le périmètre accessible
 * à l'utilisateur (le même que sur le reste de l'application, fourni par les services de chaque domaine).
 */
@inject()
export class GlobalSearchService {
  constructor(
    public exploitationService: ExploitationService,
    public projectService: ProjectService,
    public logEntryService: LogEntryService,
    public aacService: AacService
  ) {}

  async search(query: string, userId: string) {
    const [exploitations, aacs, installations, projects, projectSteps, logEntries] =
      await Promise.all([
        this.searchExploitations(query, userId),
        withAacFallback('AAC', () => this.aacService.searchAacs(query, GLOBAL_SEARCH_LIMIT)),
        withAacFallback('installations', () =>
          this.aacService.searchInstallations(query, GLOBAL_SEARCH_LIMIT)
        ),
        this.searchProjects(query, userId),
        this.searchProjectSteps(query, userId),
        this.searchLogEntries(query, userId),
      ])

    return { exploitations, aacs, installations, projects, projectSteps, logEntries }
  }

  // Exploitations accessibles, par nom, commune ou code postal
  private searchExploitations(query: string, userId: string) {
    const exploitationsQuery = this.exploitationService
      .queryActiveExploitations(userId)
      .where((builder) => {
        builder
          .whereILike('name', `%${query}%`)
          .orWhereILike('commune', `%${query}%`)
          .orWhereILike('postalCode', `%${query}%`)
      })

    return fetchWithTotal(exploitationsQuery, (dataQuery) => dataQuery.orderBy('name', 'asc'))
  }

  // Projets accessibles, par intitulé, les plus récemment mis à jour d'abord
  private searchProjects(query: string, userId: string) {
    const projectsQuery = this.projectService
      .queryAccessibleProjects(userId)
      .whereILike('name', `%${query}%`)

    return fetchWithTotal(projectsQuery, (dataQuery) => dataQuery.orderBy('updatedAt', 'desc'))
  }

  // Étapes datées des projets accessibles, par intitulé
  private searchProjectSteps(query: string, userId: string) {
    const stepsQuery = ProjectStep.query()
      .whereNotNull('date')
      .whereILike('title', `%${query}%`)
      .whereIn('projectId', this.projectService.queryAccessibleProjects(userId).select('id'))

    return fetchWithTotal(stepsQuery, (dataQuery) =>
      dataQuery.preload('project').orderBy('date', 'desc')
    )
  }

  // Entrées de journal datées des exploitations accessibles, par intitulé
  private searchLogEntries(query: string, userId: string) {
    const logEntriesQuery = this.logEntryService
      .queryLogEntriesFromActiveExploitation()
      .whereNotNull('date')
      .whereILike('title', `%${query}%`)
      .whereIn(
        'exploitationId',
        this.exploitationService.queryActiveExploitations(userId).select('id')
      )

    return fetchWithTotal(logEntriesQuery, (dataQuery) =>
      dataQuery.preload('exploitation').orderBy('date', 'desc')
    )
  }
}
