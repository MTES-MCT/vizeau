# Carte

La cartographie repose sur [MapLibre GL](https://maplibre.org/maplibre-gl-js/docs/), qui affiche des tuiles vectorielles dans un canvas WebGL.
Les données métier (parcelles, zonages) sont servies sous forme de fichiers [PMTiles](https://docs.protomaps.com/pmtiles/) : un fichier unique par jeu de données, lu directement sur un bucket S3, sans serveur de tuiles.

## Les trois cartes

| Composant                                    | Utilisé dans                                                        | Rôle                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `components/map/VisualisationMap.tsx`        | `pages/visualisation.tsx`                                           | Carte principale : exploitations, parcelles, zonages, filtres, popups |
| `components/map/parcelles-selection-map.tsx` | Formulaire de projet (`components/projets/form/parcelles-step.tsx`) | Sélection de parcelles sur une carte simplifiée                       |
| `components/map/aac-location-map.tsx`        | Page d'une AAC (`components/aac-id/aac-map-section.tsx`)            | Petite carte de repérage non interactive, centrée sur une AAC         |

Seule `VisualisationMap` utilise le mécanisme de réconciliation décrit plus bas. Les deux autres ajoutent leurs sources et couches directement.

## D'où viennent les données

### Fonds de carte

Les styles des fonds de carte sont des fichiers JSON au [format de style MapLibre](https://maplibre.org/maplibre-style-spec/), dans `components/map/styles/` :

| Fichier         | Fond                        | Source                              |
| --------------- | --------------------------- | ----------------------------------- |
| `vector.json`   | Plan vectoriel (par défaut) | `openmaptiles.geo.data.gouv.fr`     |
| `plan-ign.json` | Plan IGN                    | Géoplateforme IGN (`data.geopf.fr`) |
| `photo.json`    | Photographies aériennes     | Géoplateforme IGN                   |

Ces trois styles incluent aussi la source `decoupage-administratif`, utilisée pour le contour des communes.

### Données métier

Elles sont lues dans des fichiers PMTiles, à partir de l'URL de base `PMTILES_URL` (variable d'environnement, voir [deploiement.md](../deploiement.md)).
Le controller la transmet à la page dans la prop `pmtilesUrl`.

| Fichier                                              | Contenu                                | Définition des couches                |
| ---------------------------------------------------- | -------------------------------------- | ------------------------------------- |
| `{PMTILES_URL}/zonage.pmtiles`                       | AAC, PPE, PPR, SAGE                    | `components/map/styles/zonage.tsx`    |
| `{PMTILES_URL}/{millesime}/parcelles_france.pmtiles` | Parcelles du RPG pour une année donnée | `components/map/styles/parcelles.tsx` |

Le protocole `pmtiles://` est enregistré auprès de MapLibre dans `hooks/use_map.ts`.

## Créer une carte : `useMap`

Toutes les cartes sont créées avec le hook `useMap` (`hooks/use_map.ts`), qui :

- crée la carte MapLibre une fois le conteneur affiché, dans un `useEffect`. C'est indispensable, car MapLibre a besoin de `window` et ne peut pas s'exécuter pendant le rendu côté serveur ;
- détruit la carte quand le composant disparaît ;
- renvoie `map` (instance réactive, pour les `useEffect` qui dépendent de la carte) et `mapRef` (instance accessible dans les gestionnaires d'événements sans provoquer de rendu).

```tsx
const { mapContainerRef, map } = useMap({ style: VECTOR_STYLE, center: [2.24, 46.54], zoom: 5 })

return <div ref={mapContainerRef} style={{ height: 220 }} />
```

Les options ne sont lues qu'à la création : les modifier ensuite ne recrée pas la carte.

Si la carte ne peut pas être créée (WebGL désactivé dans le navigateur, par exemple), `useMap` lève une erreur pendant le rendu. Chaque carte est donc enveloppée dans `MapErrorBoundary`, qui affiche un message d'erreur DSFR à la place.

## La réconciliation (`VisualisationMap`)

### Le problème

L'API de MapLibre est impérative : `addSource`, `addLayer`, `setFilter`, `setFeatureState`… Tant que la carte est simple, on peut l'appeler au fil des `useEffect`.
Mais quand l'utilisateur change de fond de carte, `map.setStyle()` supprime silencieusement tout ce qui avait été ajouté par-dessus (sources, couches, filtres, états), sans émettre d'événement.
Avec une dizaine de `useEffect` qui modifient chacun une partie de la carte, il devient impossible de garantir que tout est remis en place.

### La solution

La carte est pilotée comme un composant React : on décrit l'état voulu, et une seule fonction se charge d'y amener la carte, quel que soit son état actuel.

- **`MapDesiredState`** (`functions/map_reconciler.ts`) décrit tout ce que la carte doit afficher : millésime, couches visibles, cultures filtrées, parcelles en surbrillance, AAC sélectionnée…
- **`reconcileMap(map, state)`** compare la carte à cet état et applique les différences : sources manquantes ou obsolètes, couches, ordre, visibilité, filtres, états des parcelles. Elle peut être appelée autant de fois qu'on veut sans effet de bord (idempotente).
- **`useMapReconciler(map, desiredState)`** (`hooks/use_map_reconciler.ts`) appelle `reconcileMap` au bon moment : au chargement du style, après chaque changement de fond, et à chaque changement de l'état voulu.

`VisualisationMap` construit `desiredMapState` à partir de ses props et le passe au hook. **C'est le seul endroit où la carte est configurée** : aucune autre partie du code ne doit appeler `addLayer`, `setFilter`, `setLayoutProperty` ou `setFeatureState` sur cette carte.

### L'ordre des couches

Toutes les sources et couches gérées sont déclarées dans la liste `MAP_OVERLAYS` de `functions/map_reconciler.ts`.
L'ordre de cette liste est l'ordre d'empilement, du bas vers le haut : PPR, PPE, AAC, communes, SAGE, parcelles.
Quand le fond de carte contient la couche `water-name-lakeline` (noms des plans d'eau), les couches sont insérées en dessous, pour que les libellés restent lisibles. Sinon, elles sont ajoutées tout en haut.

### Ajouter une couche

1. Définir la source et la ou les couches dans `components/map/styles/` (`zonage.tsx` pour un zonage).
2. Ajouter un champ `showXxx` à `MapDesiredState`.
3. Ajouter l'entrée correspondante dans `MAP_OVERLAYS`, à la bonne position et avec sa règle de visibilité (`(state) => state.showXxx`).
4. Ajouter le champ dans `getDesiredStateKey` : sans ça, le changer ne relance pas la réconciliation.
5. Ajouter la prop à `VisualisationMap` et la reporter dans `desiredMapState`.

## Les parcelles

Les parcelles sont la couche la plus riche, et la plus lourde : elles ne s'affichent qu'à partir du zoom 10 (`PARCELLES_MIN_ZOOM`).

- **Couleur** : chaque parcelle est colorée selon son groupe de cultures (`code_group`), avec les couleurs de `GROUPES_CULTURAUX` (`functions/cultures-group.tsx`).
- **Surbrillance et indisponibilité** : passent par les [feature states](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#setfeaturestate) `highlighted` et `unavailable`, qui modifient l'opacité. L'identifiant utilisé est `id_parcel`.
- **Parcelles bio** : leurs couches ne sont jamais masquées, seulement rendues transparentes, pour qu'on puisse toujours les détecter sous le curseur.
- **Couche sonde** (`parcelles-probe`) : couche invisible et jamais filtrée, qui sert à lister les cultures présentes à l'écran, y compris celles masquées par le filtre.

Le filtre des cultures (`hooks/use_cultures_filter.ts`) réaffiche automatiquement une culture masquée lorsqu'elle revient à l'écran après avoir quitté la zone où elle avait été masquée.

## Interactions

- **Marqueurs d'exploitation** : des `Marker` MapLibre, recréés quand la liste des exploitations change.
- **Popups** : des `Popup` MapLibre dont le contenu est un composant React (`popup-exploitation.tsx`, `popup-parcelle.tsx`, `popup-aac.tsx`), rendu dans le nœud du popup avec `createRoot`.
- **Clics et survol** : écoutés avec `map.on('click', layerId, …)`, puis remontés à la page via les props `onParcelleClick`, `onMarkerClick`, `onAacClick`…
- **Pilotage depuis la page** : `VisualisationMap` expose via une ref les méthodes `centerOnExploitation`, `centerOnParcelle`, `centerOnAac` et `centerOnCoordinates`, utilisées par les barres latérales.

## Pièges

- **Ne pas importer MapLibre dans du code exécuté au rendu** : tout ce qui touche à la carte reste dans un `useEffect` ou un gestionnaire d'événement (voir [Rendu côté serveur](pages-et-donnees.md#rendu-côté-serveur-ssr)).
- **Après un `setStyle`, relancer la réconciliation** : `useMapReconciler` renvoie une fonction à appeler juste après, comme le fait `VisualisationMap` lors d'un changement de fond.
- **Changer de millésime recrée la source des parcelles** : les feature states sont perdus avec elle, et la réconciliation les réapplique une fois les tuiles chargées.
- **`map.isStyleLoaded()` n'est pas fiable** pour savoir si on peut configurer la carte : il reste `false` tant que toutes les tuiles ne sont pas chargées. Le hook utilise les événements `style.load` et `load` à la place.
