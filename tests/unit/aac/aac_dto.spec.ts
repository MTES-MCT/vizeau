import { test } from '@japa/runner'
import { AacDto } from '../../../app/dto/aac_dto.js'

const row = (installations: unknown) => ({ code: '61', nom: 'AAC Maillebois 1', installations })

test.group('AacDto - fromRaw', () => {
  test('returns an empty list for an AAC without installation', ({ assert }) => {
    assert.deepEqual(AacDto.fromRaw(row(null)).installations, [])
    assert.deepEqual(AacDto.fromRaw(row([])).installations, [])
  })

  test('keeps the fields of the November 2026 file', ({ assert }) => {
    const installation = {
      code: '028000418',
      nom: 'ARPENTIGNY',
      code_bss: '02542X0004/PFAEP',
      code_bss_nouveau: null,
      source_rattachement: 'point',
      recroisement_geographique: true,
      a_part: true,
      motif_a_part: 'abandon_aep',
      libelle_a_part: 'Abandonné pour l’eau potable',
      prioritaire: null,
      captages_rattaches: null,
    }

    assert.deepEqual(AacDto.fromRaw(row([installation])).installations, [installation])
  })

  test('leaves the new fields undefined with an older file', ({ assert }) => {
    const [installation] = AacDto.fromRaw(
      row([{ code: '028000381', nom: 'ST MARTIN DE LEZEAU F1', code_bss: '02165X0039' }])
    ).installations

    assert.isUndefined(installation.a_part)
    assert.isUndefined(installation.code_bss_nouveau)
    assert.isUndefined(installation.source_rattachement)
  })
})
