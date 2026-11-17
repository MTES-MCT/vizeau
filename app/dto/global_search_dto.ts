import { urlFor } from '@adonisjs/core/services/url_builder'
import type Exploitation from '#models/exploitation'
import type LogEntry from '#models/log_entry'
import type Project from '#models/project'
import type ProjectStep from '#models/project_step'
import { type GlobalSearchService, GLOBAL_SEARCH_LIMIT } from '#services/global_search_service'
import type { GlobalSearchGroupJson, GlobalSearchItemJson } from '#types/recherche'

type GlobalSearchResults = Awaited<ReturnType<GlobalSearchService['search']>>
type AacResult = GlobalSearchResults['aacs']['data'][number]
type InstallationResult = GlobalSearchResults['installations']['data'][number]

export class GlobalSearchDto {
  static fromExploitation(exploitation: Exploitation): GlobalSearchItemJson {
    return {
      id: exploitation.id,
      title: exploitation.name,
      subtitle: [exploitation.commune, exploitation.postalCode].filter(Boolean).join(' · ') || null,
      href: urlFor('exploitations.get', { id: exploitation.id }),
    }
  }

  static fromAac(aac: AacResult): GlobalSearchItemJson {
    return {
      id: aac.code,
      title: aac.nom,
      subtitle: `Code SANDRE : ${aac.code}`,
      href: urlFor('aac.show', { code: aac.code }),
    }
  }

  /**
   * Un résultat de la thématique « Points de prélèvement » : une installation, ou un captage
   * rattaché à une installation (même mélange), qui mène alors à la fiche de cette installation.
   */
  static fromInstallation(installation: InstallationResult): GlobalSearchItemJson {
    const href = urlFor('aac.showInstallation', {
      code: installation.aac_code,
      installationCode: installation.code,
    })
    const rattache = installation.captage_rattache

    if (rattache) {
      return {
        id: rattache.code,
        title: rattache.nom,
        subtitle: [`Rattaché à ${installation.nom}`, GlobalSearchDto.bssCodes(rattache)]
          .filter(Boolean)
          .join(' · '),
        href,
      }
    }

    return {
      id: installation.code,
      title: installation.nom,
      subtitle: GlobalSearchDto.bssCodes(installation),
      href,
    }
  }

  // Ancien et nouveau codes BSS d'un captage, quand il en a
  private static bssCodes(captage: {
    code_bss: string | null
    code_bss_nouveau: string | null
  }): string | null {
    return [captage.code_bss, captage.code_bss_nouveau].filter(Boolean).join(' · ') || null
  }

  static fromProject(project: Project): GlobalSearchItemJson {
    return {
      id: project.id,
      title: project.name,
      subtitle: project.updatedAt
        ? `Mis à jour le ${project.updatedAt.setLocale('fr').toFormat('d LLLL yyyy')}`
        : null,
      href: urlFor('projets.show', { projectId: project.id }),
    }
  }

  static fromProjectStep(step: ProjectStep): GlobalSearchItemJson {
    return {
      id: step.id,
      title: step.title ?? '',
      subtitle: `Projet : ${step.project.name}`,
      href: urlFor('projets.steps.get', { projectId: step.projectId, stepId: step.id }),
    }
  }

  static fromLogEntry(logEntry: LogEntry): GlobalSearchItemJson {
    return {
      id: logEntry.id,
      title: logEntry.title ?? '',
      subtitle: `Exploitation : ${logEntry.exploitation.name}`,
      href: urlFor('log_entries.get', {
        exploitationId: logEntry.exploitationId,
        logEntryId: logEntry.id,
      }),
    }
  }

  static toGroups(results: GlobalSearchResults): GlobalSearchGroupJson[] {
    // Étapes de projet et entrées de journal forment ensemble la thématique « Tâches programmées » :
    // on garde les plus récentes des deux sources.
    const taches = [
      ...results.projectSteps.data.map((step) => ({
        date: step.date?.toISODate() ?? '',
        item: GlobalSearchDto.fromProjectStep(step),
      })),
      ...results.logEntries.data.map((logEntry) => ({
        date: logEntry.date?.toISODate() ?? '',
        item: GlobalSearchDto.fromLogEntry(logEntry),
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, GLOBAL_SEARCH_LIMIT)
      .map(({ item }) => item)

    return [
      {
        category: 'exploitations',
        total: results.exploitations.total,
        items: results.exploitations.data.map(GlobalSearchDto.fromExploitation),
      },
      {
        category: 'aac',
        total: results.aacs.total,
        items: results.aacs.data.map(GlobalSearchDto.fromAac),
      },
      {
        category: 'points',
        total: results.installations.total,
        items: results.installations.data.map(GlobalSearchDto.fromInstallation),
      },
      {
        category: 'projets',
        total: results.projects.total,
        items: results.projects.data.map(GlobalSearchDto.fromProject),
      },
      {
        category: 'taches',
        total: results.projectSteps.total + results.logEntries.total,
        items: taches,
      },
    ]
  }
}
