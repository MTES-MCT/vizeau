---
name: onboard-users
description: 'Create VizEau user accounts in the local database from a contact list (account request form, CSV, SANDRE export or JSON): build the users batch with generated passwords, check the territoire codes and the emails already in the database, run user:seed and user:assign-territoires, verify the territoires, and hand over the credentials and the batch file. Use when the user asks to onboard, create, add or seed users/accounts, or hands over a contacts / account requests file to turn into accounts.'
---

Turns a contact list into VizEau accounts linked to their territoires, in the
**local database only**. The mechanism already exists in the app: a JSON
batch (type `UserSeeds` in `app/services/user_service.ts`, validated by
`app/validators/user_seed.ts`) is read with `--file` by `node ace user:seed`
(creates the new emails only) and `node ace user:assign-territoires` (attach
territoires, never detaches). This skill builds the batch, checks it, runs it
locally, and hands over the batch file.

**Talk to the user in French.**

## Rules

- **Local only.** Never propose, prepare or describe account creation on a
  remote environment (Scalingo dev or prod), not even as commands for the user
  to run. For remote environments the deliverable is the batch JSON file,
  nothing more.
- The generated files contain **plain-text passwords**. Write them only under
  `tmp/onboarding/` (gitignored), never print a password in the chat, never
  commit them, never send them anywhere.
- `user:seed` only creates the emails that don't exist yet and lists the
  others as skipped. `--reset-passwords` updates them too and **overwrites
  their password**: use it only when the user explicitly accepts a reset.
- Once accounts are created, never regenerate the batch: the passwords would
  no longer match. Patch the JSON files instead (see step 7).

## 1. Get the contact list

Ask for the input file if it wasn't given (it is often at the project root or
in `~/Downloads`, named like `<date>_Demandes_Comptes*.csv` or
`<date>comptes-a-creer.csv`; list the folder if the name doesn't match exactly).
Supported formats:

| Format               | Recognized by                                                    | Notes                                                                                         |
| -------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Account request form | columns `Nom`, `Prénom`, `Email`, `BAC`, no `Action`             | `BAC` is a code list (`43;56`) or free text, see below; rows with `Creation` true are skipped |
| SANDRE export        | `;` separator, columns `BAC`, `Nom`, `Prénom`, `Action`, `Email` | only rows whose `Action` contains `Code SANDRE OK` are kept; codes are extracted from `BAC`   |
| Simple CSV           | header `territoireCodes,territoireIds,email,fullName`            | lists inside a cell are comma-separated and quoted                                            |
| JSON                 | `.json` extension, array shaped like `UserSeeds`                 | missing passwords are generated                                                               |

If the file is in another shape (Excel, pasted list, other columns), convert
it to the simple CSV in `tmp/onboarding/` first, and show the user the mapping
you chose.

## 2. Build the batch

```bash
node .claude/skills/onboard-users/build_users.mjs <input> --name USERS_<YYYY-MM-DD>
```

The script lowercases emails, drops invalid ones, merges duplicates, strips
leading zeros from codes (they are stored that way in `territoires.code`),
generates 10-character alphanumeric passwords and writes:

- `tmp/onboarding/<name>.json`: the batch, given to the commands with `--file`
- `tmp/onboarding/<name>_credentials.md`: name / email / password blocks

Options:

- `--exclude <row>:<number>,...` drops a number read in the free-text `BAC`
  of a data row (1-based, as printed in the tables)
- `--exclude-email <email>,...` removes people from the batch

### Review the free-text codes

The first line of the output tells which kind of `BAC` the account request
form holds:

- `BAC holds code lists only (nothing to review)`: every cell is made of
  codes and separators (`;`, `,`, `.`, spaces). Short codes (`1`, `2`, `8`…)
  are real codes, nothing is flagged: skip this review and the `--show`
  lookups, go to step 3.
- `BAC is free text in N/M row(s)`: review as described below. Only those
  rows can be flagged.

With free text, the script prints **Numbers to review**: short
numbers right after a word or alone in parentheses. They are often part of an
AAC name (« Coupeaume 2 », « SUIPPES 1 », « MILLY-LA-FORET 1 ») or a
department (« Carentoir (56) »), but can be real codes (« Moulines Tournebu
78 »). The same text is often copied on several rows (colleagues of the same
structure): check **every** flagged row, not just the first one.

Decide with the territoire names (step 3, `--show`): a number is a real code
when its territoire name matches the text around it. Example: code `2` is
« FONT LONGUE », so the `2` of « Coupeaume 2 » is not a code (Coupeaume 2 is
code `8`); code `78` is « AAC MOULINES ET TOURNEBU », so it is kept. Also read
the full `BAC` of long rows to spot places mentioned without a code (« AAC
définie, j'attends le retour du Sandre »).

Re-run the build with the `--exclude` list, and report to the user, in French:
number of users, skipped rows with their reason, excluded numbers and why,
warnings (no territoire, no name, duplicates, non-UUID ids). Ask what to do
with each problem before going further.

## 3. Check the territoires

```bash
node --env-file=.env .claude/skills/onboard-users/check_codes.mjs tmp/onboarding/<name>.json --show <code>,<code>
```

It prints the missing and inactive codes, the users affected (with how many
usable codes they keep), the emails already in the database, and the names of
the codes passed to `--show` (`psql` is not installed, use this script).

**A missing code is not in the AAC referential.** The territoires are seeded
from `aac.parquet` on the S3 bucket by `7_territoire_seeder`; a code absent
from the database is absent from that file (a very recent AAC, or a typo by
the requester). Running the territoire seeder won't add it, don't propose it.
Missing codes are usually the highest numbers of the batch (the newest AACs).
Tell the user which codes are missing and who is affected, and ask whether to
keep users who would end up with no territoire or to remove them
(`--exclude-email`) until their codes are clarified.

## 4. Emails already in the database

`check_codes.mjs` lists the **emails already in database**. When there are
none, go straight to step 5: every user will be created.

Otherwise, `user:seed` will skip them, and their credentials in
`_credentials.md` won't work. Ask the user whether to remove them from the
batch (`--exclude-email`) or to reset their password with `--reset-passwords`
(then their new credentials must be sent too). To preview a run, add
`--dry-run` to the commands of step 5: nothing is written.

## 5. Run locally

After the user agrees:

```bash
node ace user:seed --file tmp/onboarding/<name>.json
# only if the user accepted to reset the existing accounts:
# node ace user:seed --file tmp/onboarding/<name>.json --reset-passwords
node ace user:assign-territoires --file tmp/onboarding/<name>.json
```

## 6. Verify

`user:seed` should list every user as created, none as skipped, and
`user:assign-territoires` print the number of territoires newly attached to
each user. Then:

```bash
node --env-file=.env .claude/skills/onboard-users/check_codes.mjs tmp/onboarding/<name>.json --verify
```

It checks that every user of the batch exists and has one territoire per
known code and id (exit code 1 on a mismatch). A user who existed before the
batch may have more territoires than expected: that's not an error, since
`user:assign-territoires` never detaches. Report any other mismatch.

## 7. Fix a mistake after the run

`user:assign-territoires` never detaches. If a wrong territoire was attached,
delete the rows from `territoire_user_relations` for those users and codes,
and remove the code from the user in `<name>.json` so the delivered batch
stays right. Don't rebuild the
batch (new passwords).

## 8. Hand over

Tell the user:

- how many accounts were created locally, and what is left: rows skipped,
  users removed, codes missing, users without territoire;
- `tmp/onboarding/<name>_credentials.md`: the credentials to send; it holds
  plain-text passwords and should be deleted once sent;
- `tmp/onboarding/<name>.json`: the batch, to give to `user:seed` and
  `user:assign-territoires` with `--file`, same passwords as the local
  accounts. Just give the path, no remote instructions;
- the input file, if it sits in the project root: it holds personal data and
  should be moved or deleted.

A user who lost their password later goes through
`node ace user:reset-password <email>`, not through a new batch.
