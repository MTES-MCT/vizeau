# Commandes CLI

Toutes les commandes se lancent avec `node ace <commande>`.

---

## `user:seed`

Crée ou met à jour les utilisateurs définis dans la variable d'environnement `USERS_TO_SEED`.

```bash
node ace user:seed
```

La variable `USERS_TO_SEED` doit contenir un tableau JSON :

```json
[{ "email": "foo@bar.com", "fullName": "Foo Bar", "password": "secret" }]
```

---

## `user:assign-territoires`

Assigne les territoires aux utilisateurs définis dans `USERS_TO_SEED`, en se basant sur les champs `territoireCodes` (codes SANDRE) et/ou `territoireIds` (UUIDs).

```bash
node ace user:assign-territoires
```

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
