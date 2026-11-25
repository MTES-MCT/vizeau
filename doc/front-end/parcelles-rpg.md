# Données du RPG dans l'éditeur de parcelles

L'éditeur de parcelles (`components/parcelle/parcelles-workspace`) peut demander au serveur ce que les tuiles ne disent pas : le PACAGE d'une parcelle, les parcelles d'un PACAGE, les exploitations Viz'Eau de la zone…

Comme le reste de l'application, ces données arrivent en props Inertia, sans route JSON : six props optionnelles `rpg*`, proposées par toutes les pages qui ouvrent l'éditeur. La page les demande par un rechargement partiel, avec leurs paramètres (voir [Charger les données plus tard](pages-et-donnees.md#charger-les-données-plus-tard)).

## À savoir

- **Zone de l'utilisateur :** l'emprise de chacune de ses AAC, élargie de 10 km. Une parcelle n'est détaillée, et son PACAGE donné, que si elle touche cette zone. La prop `rpgZone` la donne, par exemple pour la dessiner ou pour ne pas chercher une parcelle qui en sort.
- **PACAGE :** numéro de déclarant à la PAC, lu dans les fichiers de l'ASP. C'est une indication de la déclaration, pas une référence : les noms affichés sont ceux des exploitations Viz'Eau. Il s'écrit avec le département sur 3 caractères (`057`, ou `02A` et `02B` pour la Corse) suivi de 6 chiffres.
- **Millésime :** toutes les props sauf `rpgZone` prennent un `millesime` parmi ceux de `RPG_MILLESIMES`. L'identifiant d'une parcelle (`rpgId`) ne vaut que pour son millésime.
- **Exploitations :** une exploitation Viz'Eau est `{ id, name }`. Deux exploitations peuvent avoir le même nom : les comparer par `id`.
- **Disponibilité :** la prop partagée `rpgPacageSearch` vaut `true` quand le serveur lit les Parquet du RPG (`RPG_PARQUET_URL`). Sinon, les props qui les lisent valent `null`. `rpgZone` et `rpgZoneExploitations` n'en ont pas besoin et restent disponibles.
- **Paramètres invalides :** une prop dont les paramètres manquent ou sont invalides vaut `null`, sans erreur. Vérifier le format d'un PACAGE saisi avant de le chercher.

Les types sont dans `types/rpg.ts`, partagé par le serveur et le front : `import type { RpgPacageResult } from '#types/rpg'`.

## Les props

| Prop                     | Paramètres                     | Contenu                                                | Type                             |
| ------------------------ | ------------------------------ | ------------------------------------------------------ | -------------------------------- |
| `rpgZone`                | aucun                          | Zone de l'utilisateur, une emprise par AAC             | `Bbox[]`                         |
| `rpgPacage`              | `millesime`, `pacage`          | Parcelles d'un PACAGE                                  | `RpgPacageResult`                |
| `rpgParcellePacage`      | `millesime`, `rpgId`, `x`, `y` | PACAGE d'une parcelle, avec toutes ses parcelles       | `RpgPacageResult`                |
| `rpgEmprisePacages`      | `millesime`, `bbox`            | PACAGE de chaque parcelle d'une emprise                | `RpgEmprisePacages`              |
| `rpgExploitationPacages` | `millesime`, `exploitationId`  | PACAGE des parcelles enregistrées d'une exploitation   | `RpgExploitationPacages \| null` |
| `rpgZoneExploitations`   | `millesime`                    | Exploitations Viz'Eau de la zone, avec leurs parcelles | `RpgZoneExploitation[]`          |

Une emprise (`Bbox`) s'écrit `[ouest, sud, est, nord]`, en degrés. En paramètre, `bbox` s'écrit `ouest,sud,est,nord`.

### Parcelles d'un PACAGE : `rpgPacage` et `rpgParcellePacage`

`rpgPacage` cherche un PACAGE saisi. `rpgParcellePacage` part d'une parcelle cliquée sur la carte : son `rpgId` et son centroïde (`x`, `y`, en degrés), qui situe la recherche. Les deux renvoient le même résultat, selon `status` :

- `found` : le PACAGE a au moins une parcelle dans la zone ;
- `outsideZone` : aucune de ses parcelles n'est dans la zone, ou la parcelle cliquée en sort (son PACAGE n'est alors pas cherché) ;
- `notFound` : PACAGE absent du millésime, ou aucune parcelle de ce numéro à cet endroit.

Avec `found` viennent :

- `pacage` et `millesime` ;
- `parcelles` : ses parcelles dans la zone, avec `rpgId`, `cultureCode`, `surface` (en hectares, au centième), `bio`, `centroid` et `exploitation`, l'exploitation Viz'Eau à laquelle la parcelle est déjà rattachée pour ce millésime, ou `null` ;
- `exploitation` : l'exploitation Viz'Eau qui a le plus de parcelles de ce PACAGE, ou `null` ;
- `bbox` : l'emprise de ces parcelles, pour y centrer la carte ;
- `parcellesHorsZone` : le nombre de ses parcelles hors de la zone, jamais détaillées. De quoi prévenir que le PACAGE en compte d'autres.

Une parcelle rattachée à une autre exploitation que celle qu'on édite ne peut pas lui être ajoutée, comme celles de `unavailableParcellesIds`.

### PACAGE d'une emprise : `rpgEmprisePacages`

Pour chaque PACAGE présent dans l'emprise, les `rpgId` de ses parcelles qui touchent à la fois l'emprise et la zone, les PACAGE les plus fournis d'abord :

```ts
{
  pacages: [{ pacage: '057000001', rpgIds: ['1001', '1002'] }]
}
```

L'emprise fait au plus 0,25° de côté (20 à 28 km) : l'emprise d'une sélection, ou celle de la carte à partir du zoom où les parcelles s'affichent. Usages : regrouper une sélection par PACAGE, colorer la carte par PACAGE, afficher le PACAGE d'une parcelle survolée. Le détail d'un PACAGE s'obtient ensuite avec `rpgPacage`.

### PACAGE d'une exploitation : `rpgExploitationPacages`

Part des parcelles enregistrées de l'exploitation pour le millésime :

- `pacages` : chacun de leurs PACAGE, au format `found` ci-dessus, avec toutes ses parcelles de la zone, rattachées ou non. Celles dont `exploitation` vaut `null` sont des parcelles du PACAGE qui ne sont encore rattachées à personne : de quoi proposer de compléter l'exploitation ;
- `horsZone` : parcelles enregistrées hors de la zone, dont le PACAGE n'est pas cherché ;
- `introuvables` : parcelles enregistrées absentes du RPG du millésime à leur emplacement.

`null` si l'utilisateur n'a pas accès à l'exploitation. Elle n'a pas de sens à la création d'une exploitation, qui n'a encore aucune parcelle enregistrée.

### Exploitations de la zone : `rpgZoneExploitations`

Les exploitations Viz'Eau qui ont des parcelles dans la zone pour le millésime, avec les `rpgId` de ces parcelles, les plus grandes d'abord. Usages : colorer la carte par exploitation, nommer l'exploitation d'une parcelle survolée, mettre en évidence toutes ses parcelles. Elle ne lit pas les Parquet.

## Charger une prop

On demande la prop par `router.reload`, avec ses paramètres dans `data`. `preserveUrl` garde l'adresse de la page telle quelle : les paramètres de la recherche n'y apparaissent pas, et le millésime de la page Carte ne change pas.

```ts
import { router } from '@inertiajs/react'
import type { RpgPacageResult } from '#types/rpg'

function loadPacage(pacage: string, millesime: string) {
  return new Promise<RpgPacageResult | null>((resolve, reject) => {
    router.reload({
      only: ['rpgPacage'],
      data: { millesime, pacage },
      preserveUrl: true,
      onSuccess: (page) => resolve((page.props.rpgPacage as RpgPacageResult | null) ?? null),
      onHttpException: () => reject(new Error('Recherche impossible')),
      onNetworkError: () => reject(new Error('Recherche impossible')),
    })
  })
}
```

- Plusieurs props peuvent être demandées par le même rechargement, avec tous leurs paramètres dans `data`.
- Les rechargements sont asynchrones : deux recherches lancées l'une après l'autre peuvent répondre dans le désordre. Ignorer une réponse qui arrive après une recherche plus récente.
- Une recherche dans les Parquet prend de quelques dixièmes de seconde à quelques secondes, plus longtemps la première fois dans un autre millésime que celui par défaut : afficher un état de chargement.

## Côté serveur

- `app/helpers/rpg_editor_props.ts` définit les props. Une page qui ouvre l'éditeur les ajoute avec `...rpgEditorProps(ctx)`.
- Une page qui enregistre ses visites ne le fait pas pour un rechargement qui ne demande que ces props (`isRpgEditorReload(request)`) : ce n'est pas une visite, et ses paramètres (un PACAGE…) n'ont rien à faire dans le journal.
- `app/services/rpg_pacage_service.ts` fait les recherches, dans les Parquet privés du RPG lus par DuckDB et dans la base de Viz'Eau.
