import { Head } from '@inertiajs/react'
import Layout from '~/ui/layouts/layout'

export default function Accessibilite() {
  return (
    <Layout>
      <Head title="Connexion" />
      <div className="fr-container fr-my-10w">
        <h1>Déclaration d’accessibilité</h1>
        <p>Établie le 9 septembre 2026.</p>
        <p>
          Le ministère de la transition écologique s’engage à rendre son service accessible,
          conformément à l’<strong>article 47 de la loi n° 2005-102 du 11 février 2005</strong>.
        </p>
        <p>À cette fin, nous mettons en œuvre la stratégie et les actions suivantes: </p>
        <ul>
          <li>
            <a href="https://beta.gouv.fr/accessibilite/schema-pluriannuel">Schéma pluriannuel</a>
          </li>
        </ul>
        <p></p>
        <p>
          Cette déclaration d’accessibilité s’applique à{' '}
          <a href="/">
            <strong>Viz'eau</strong>
          </a>
        </p>
        <h2>État de conformité</h2>
        <p>
          Viz'eau est <strong>non conforme</strong> avec le{' '}
          <strong>
            <abbr title="Référentiel général d’amélioration de l’accessibilité">RGAA</abbr>
          </strong>
          .<br /> Le site n’a encore pas été audité.
        </p>

        <h2>Amélioration et contact</h2>
        <p>
          Si vous n’arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le
          responsable de Viz'eau pour être orienté vers une <strong>alternative accessible</strong>{' '}
          ou obtenir le contenu <strong>sous une autre forme</strong>.
        </p>
        <ul className="basic-information feedback h-card">
          <li>
            E-mail :{' '}
            <strong>
              <a href="mailto:vizeau@beta.gouv.fr">vizeau@beta.gouv.fr</a>
            </strong>
          </li>
          <li>
            Adresse: <strong>Tour Séquoia 1 place Carpeaux 92055 LA DÉFENSE CEDEX</strong>
          </li>
        </ul>
        <h2>Voie de recours</h2>
        <p>
          Cette procédure est à utiliser dans le cas suivant : vous avez signalé au responsable du
          site internet <strong>un défaut d’accessibilité</strong> qui vous empêche d’accéder à un
          contenu ou à un des services du portail et vous n’avez pas obtenu de réponse
          satisfaisante.
        </p>
        <p>Vous pouvez :</p>
        <ul>
          <li>
            Écrire un message au{' '}
            <a href="https://formulaire.defenseurdesdroits.fr/">Défenseur des droits</a>
          </li>
          <li>
            Contacter{' '}
            <a href="https://www.defenseurdesdroits.fr/saisir/delegues">
              le délégué du Défenseur des droits dans votre région
            </a>
          </li>
          <li>
            Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) :<br />
            <strong>
              Défenseur des droits
              <br />
              Libre réponse 71120 75342 Paris CEDEX 07
            </strong>
          </li>
        </ul>
        <hr />
        <p>
          Cette déclaration d’accessibilité a été créé le 9 septembre 2026 grâce au{' '}
          <a href="https://betagouv.github.io/a11y-generateur-declaration/#create">
            Générateur de Déclaration d’Accessibilité
          </a>
          .
        </p>
      </div>
    </Layout>
  )
}
