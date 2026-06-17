import Captage from '#models/captage'
import { CaptageFormJson, CaptageJson } from '#types/models'

export class CaptageDto {
  static fromModel(captage: Captage): CaptageJson {
    return {
      id: captage.id,
      code: captage.code,
      nom: captage.name,
      code_bss: captage.bssCode,
      commune: captage.commune ?? null,
      type: captage.type,
      etat: captage.state,
      prioritaire: captage.prioritaire,
    }
  }

  static toFormJson(captage: Captage): CaptageFormJson {
    return {
      id: captage.id,
      code: captage.code,
      nom: captage.name,
      etat: captage.state,
      commune: captage.commune ?? null,
      type: captage.type,
      prioritaire: captage.prioritaire,
    }
  }

  static toFormJsonArray(captages: Captage[]): CaptageFormJson[] {
    return captages.map(CaptageDto.toFormJson)
  }
}
