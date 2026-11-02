# Commandes CLI

Toutes les commandes se lancent avec `node ace <commande>`.

---

## `user:seed`

Crée les utilisateurs d'un fichier JSON qui n'existent pas encore. Les utilisateurs existants (même email) sont ignorés et listés.

```bash
node ace user:seed --file users.json
```

Avec `--reset-passwords`, les utilisateurs existants sont aussi mis à jour, et leur mot de passe est écrasé par celui du batch.

```bash
node ace user:seed --file users.json --reset-passwords
```

Avec `--dry-run`, la commande affiche les comptes à créer, ignorer ou mettre à jour, sans rien écrire.

Pour créer des comptes sur Scalingo, voir [deploiement.md](deploiement.md).

Le fichier contient un tableau JSON, validé avant toute écriture :

```json
[{ "email": "foo@bar.com", "fullName": "Foo Bar", "password": "secret" }]
```

---

## `user:territoires`

Consulte et modifie les territoires d'un ou plusieurs utilisateurs. Les territoires sont désignés par leur code AAC (SANDRE) ou leur UUID, séparés par des virgules.

Sans option, la commande affiche les territoires des utilisateurs, sans rien modifier :

```bash
node ace user:territoires foo@bar.com
```

`--add` rattache des territoires et `--remove` en détache, en une seule fois. Plusieurs emails peuvent être donnés pour appliquer les mêmes changements à chacun :

```bash
node ace user:territoires foo@bar.com bar@baz.com --add 6034,6035 --remove 570
```

`--sync` remplace toute la liste, comme la méthode `sync()` de Lucid : les territoires absents de la liste sont détachés.

```bash
node ace user:territoires foo@bar.com --sync 1915,5521
```

Avec `--file`, les territoires sont lus dans un batch JSON (champs `territoireCodes` et/ou `territoireIds`), au même format que pour `user:seed`. Par défaut, ils sont seulement rattachés. Avec `--sync`, sans valeur, le fichier fait foi : chaque utilisateur du batch se retrouve avec exactement les territoires du fichier, et un utilisateur sans territoire dans le fichier perd tous les siens.

```bash
node ace user:territoires --file users.json
node ace user:territoires --file users.json --sync
```

```json
[{ "email": "foo@bar.com", "territoireCodes": ["6034"], "territoireIds": ["uuid-..."] }]
```

Chaque utilisateur affiche les territoires rattachés (`+`) et détachés (`-`) avec leur nom, et le nombre de territoires qu'il garde. Avec `--dry-run`, rien n'est écrit.

- Un code ou un UUID introuvable est signalé et ignoré pour `--add` et `--remove`. Avec `--sync`, la commande s'arrête sans rien écrire, pour ne pas détacher des territoires à partir d'une liste incomplète.
- Un email introuvable est signalé, et la commande se termine avec le code de sortie 1.
- Tous les changements sont écrits dans une seule transaction.

---

## `territoire:create`

Crée un nouveau territoire avec le nom donné.

```bash
node ace territoire:create "Nom du territoire"
```

---

## `user:reset-password`

Réinitialise le mot de passe d'un utilisateur et affiche le nouveau mot de passe généré.

```bash
node ace user:reset-password <email>
```

Le nouveau mot de passe est affiché directement dans la sortie standard afin de ne jamais apparaître dans les logs applicatifs.
