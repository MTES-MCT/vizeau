import type ProjectStep from '#models/project_step'
import { BaseCsvService } from '#services/base_csv_service'

export class ProjectStepCsvService extends BaseCsvService<ProjectStep> {
  protected getHeaders(): string[] {
    return ['Date', 'Titre', 'Notes', 'Statut', 'Étiquettes', 'Créé le', 'Modifié le']
  }

  protected buildRow(step: ProjectStep): string {
    return this.buildRowFromFields([
      this.formatDate(step.date),
      step.title,
      step.note,
      step.isValidated ? 'Validée' : 'Non validée',
      step.tags?.map((t) => t.name).join(' | ') ?? null,
      this.formatDateTime(step.createdAt),
      this.formatDateTime(step.updatedAt),
    ])
  }
}
