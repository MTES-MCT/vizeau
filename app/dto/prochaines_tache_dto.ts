import type ProjectStep from '#models/project_step'
import type LogEntry from '#models/log_entry'
import { type ProchainesTacheJson } from '#types/models'

export class ProchainesTacheDto {
  static fromProjectStep(step: ProjectStep): ProchainesTacheJson {
    return {
      id: step.id,
      titre: step.title,
      date: step.date!.toISODate() as string,
      nomProjet: step.project?.name,
      projetId: step.projectId,
    }
  }

  static fromLogEntry(logEntry: LogEntry): ProchainesTacheJson {
    return {
      id: logEntry.id,
      titre: logEntry.title ?? '',
      date: logEntry.date!.toISODate() as string,
      nomExploitation: logEntry.exploitation?.name,
      exploitationId: logEntry.exploitationId,
      userId: logEntry.userId,
    }
  }
}
