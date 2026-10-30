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

## `user:assign-territoires`

Assigne les territoires aux utilisateurs d'un fichier JSON, sans jamais en retirer, en se basant sur les champs `territoireCodes` (codes SANDRE) et/ou `territoireIds` (UUIDs).

```bash
node ace user:assign-territoires --file users.json
```

Chaque utilisateur affiche le nombre de territoires nouvellement rattachés, et les codes ou ids introuvables. Avec `--dry-run`, rien n'est écrit.

```json
[{ "email": "foo@bar.com", "territoireCodes": ["AAC001"], "territoireIds": ["uuid-..."] }]
```

---

## `territoire:create`

Crée un nouveau territoire avec le nom donné.

```bash
node ace territoire:create "Nom du territoire"
```

---

## `territoire:assign`

Assigne un territoire existant à un utilisateur existant (par leurs UUIDs).

```bash
node ace territoire:assign <userId> <territoireId>
```

---

## `user:reset-password`

Réinitialise le mot de passe d'un utilisateur et affiche le nouveau mot de passe généré.

```bash
node ace user:reset-password <email>
```

Le nouveau mot de passe est affiché directement dans la sortie standard afin de ne jamais apparaître dans les logs applicatifs.
