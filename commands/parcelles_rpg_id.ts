import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { ParcelleRpgIdService } from '#services/parcelle_rpg_id_service'

export default class ParcellesRpgId extends BaseCommand {
  static commandName = 'parcelles:rpg-id'
  static description =
    "Remplace l'identifiant RPG des parcelles d'un millésime par l'identifiant stable des tuiles du projet rpg"

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Millésime des parcelles à migrer, par exemple 2024' })
  declare millesime: string

  @args.string({
    description: 'Fichier parcelles.parquet du millésime (privé) : chemin local ou URL s3://',
  })
  declare parquet: string

  @flags.boolean({ description: "Écrire en base ; sans ce drapeau, rien n'est modifié" })
  declare apply: boolean

  async run() {
    if (!/^\d{4}$/.test(this.millesime)) {
      this.logger.error(`Millésime invalide : ${this.millesime}`)
      this.exitCode = 1
      return
    }

    try {
      const service = new ParcelleRpgIdService()
      const prefix = this.apply ? '' : '[À BLANC] '
      const { correspondances, unmatched } = await service.match(
        Number(this.millesime),
        this.parquet
      )
      const passe = (n: number) => correspondances.filter(({ passe: p }) => p === n).length

      this.logger.info(
        `${prefix}${correspondances.length + unmatched.length} parcelle(s) de ${this.millesime} à traiter : ` +
          `${passe(1)} retrouvée(s) à la passe 1, ${passe(2)} à la passe 2, ${unmatched.length} introuvable(s)`
      )
      for (const { parcelleId, cultureCode, surface } of unmatched) {
        this.logger.warning(
          `${prefix}Parcelle ${parcelleId} (${cultureCode ?? 'sans culture'}, ${surface ?? '?'} ha) introuvable : à rattacher à la main`
        )
      }

      const report = await service.migrate(correspondances, { apply: this.apply })
      this.logger.success(
        `${prefix}${report.migrated.length} parcelle(s) ${report.applied ? 'migrée(s)' : 'à migrer'}`
      )
      if (report.upToDate.length > 0) {
        this.logger.info(`${prefix}${report.upToDate.length} parcelle(s) déjà à jour`)
      }
      for (const parcelleId of report.missing) {
        this.logger.warning(`${prefix}Parcelle ${parcelleId} supprimée pendant le calcul, ignorée`)
      }
      for (const { parcelleId, reason } of report.conflicts) {
        this.logger.error(`${prefix}Conflit sur la parcelle ${parcelleId} : ${reason}`)
      }

      if (report.conflicts.length > 0) {
        this.logger.error(`${prefix}Conflits : rien n'est écrit, relancer la commande`)
        this.exitCode = 1
      } else if (unmatched.length > 0) {
        this.exitCode = 1
      }
    } catch (error) {
      this.logger.error(
        error instanceof Error ? error.message : 'Échec de la migration des identifiants RPG'
      )
      this.exitCode = 1
    }
  }
}
