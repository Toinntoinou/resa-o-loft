import { SiteHeader } from "@/components/SiteHeader";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Politique de confidentialité" };

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-lg font-semibold text-brand-900">
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-stone-600">
        {children}
      </div>
    </section>
  );
}

export default function ConfidentialitePage() {
  const address = LEGAL.address || "[adresse du siège à compléter]";
  return (
    <div className="min-h-screen">
      <SiteHeader subtitle="Politique de confidentialité" />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <a href="/" className="text-sm text-stone-400 hover:text-stone-600">
          ← Retour à la réservation
        </a>

        <h1 className="title-accent mt-3 text-3xl">
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Dernière mise à jour : {LEGAL.updated}
        </p>

        <div className="card mt-6">
          <Section title="1. Responsable du traitement">
            <p>
              Les données recueillies via cette plateforme de réservation sont
              traitées par <strong>{LEGAL.entity}</strong>, exploitant de
              l&apos;espace de coworking « {LEGAL.brand} ».
            </p>
            <p>
              Adresse : {address}
              <br />
              Contact (données personnelles) :{" "}
              <a
                className="text-brand-600 underline"
                href={`mailto:${LEGAL.contactEmail}`}
              >
                {LEGAL.contactEmail}
              </a>
            </p>
          </Section>

          <Section title="2. Données collectées">
            <p>Lors d&apos;une réservation, nous collectons :</p>
            <ul className="list-disc pl-5">
              <li>vos nom et prénom ;</li>
              <li>votre adresse email ;</li>
              <li>votre société (facultatif) ;</li>
              <li>votre téléphone (facultatif) ;</li>
              <li>une éventuelle remarque que vous saisissez (facultatif) ;</li>
              <li>la date et le créneau réservés.</li>
            </ul>
            <p>
              Aucune donnée bancaire n&apos;est collectée : la plateforme ne
              gère pas de paiement en ligne.
            </p>
          </Section>

          <Section title="3. Finalités">
            <p>
              Ces données servent exclusivement à{" "}
              <strong>gérer votre réservation</strong> de poste (traiter la
              demande, vous adresser une confirmation, vous contacter si
              nécessaire au sujet de votre venue).
            </p>
          </Section>

          <Section title="4. Base légale">
            <p>
              Le traitement repose sur l&apos;<strong>exécution de mesures
              précontractuelles et du service de réservation</strong> que vous
              demandez (article 6.1.b du RGPD).
            </p>
          </Section>

          <Section title="5. Destinataires et sous-traitants">
            <p>
              Vos données sont accessibles à l&apos;équipe de {LEGAL.brand}.
              Elles sont hébergées et traitées par des prestataires techniques
              agissant comme sous-traitants :
            </p>
            <ul className="list-disc pl-5">
              <li>
                <strong>Vercel Inc.</strong> — hébergement de
                l&apos;application (traitement configuré en région{" "}
                <em>Europe — Paris</em>).
              </li>
              <li>
                <strong>Neon</strong> — base de données, stockage en{" "}
                <em>Union européenne (Francfort)</em>.
              </li>
              <li>
                <strong>Resend</strong> — envoi des emails de confirmation,
                lorsque cette option est activée.
              </li>
            </ul>
            <p>
              Vos données ne sont ni vendues, ni cédées, ni utilisées à des fins
              publicitaires.
            </p>
          </Section>

          <Section title="6. Durée de conservation">
            <p>
              Les réservations sont conservées{" "}
              <strong>{LEGAL.retentionMonths} mois</strong> après la date
              réservée, puis <strong>supprimées automatiquement</strong>. Vous
              pouvez demander leur suppression avant ce délai (voir vos droits).
            </p>
          </Section>

          <Section title="7. Transferts hors Union européenne">
            <p>
              Certains sous-traitants (Vercel, Resend) sont établis aux
              États-Unis. Le cas échéant, ces transferts sont encadrés par les
              garanties appropriées prévues par le RGPD (clauses contractuelles
              types et/ou Data Privacy Framework).
            </p>
          </Section>

          <Section title="8. Vos droits">
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès,
              de rectification, d&apos;effacement, de limitation,
              d&apos;opposition et de portabilité de vos données. Pour les
              exercer, écrivez à{" "}
              <a
                className="text-brand-600 underline"
                href={`mailto:${LEGAL.contactEmail}`}
              >
                {LEGAL.contactEmail}
              </a>
              .
            </p>
          </Section>

          <Section title="9. Réclamation">
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez
              introduire une réclamation auprès de la CNIL —{" "}
              <a
                className="text-brand-600 underline"
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.cnil.fr
              </a>{" "}
              (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07).
            </p>
          </Section>

          <Section title="10. Cookies">
            <p>
              La plateforme n&apos;utilise <strong>aucun cookie publicitaire ni
              traceur</strong>. Un unique cookie technique, strictement
              nécessaire, permet de maintenir la session de l&apos;espace de
              gestion. Aucun consentement cookies n&apos;est donc requis.
            </p>
          </Section>

          <Section title="11. Sécurité">
            <p>
              Les échanges sont chiffrés (HTTPS), les données sont chiffrées au
              repos, et l&apos;accès à l&apos;espace de gestion est protégé par
              mot de passe.
            </p>
          </Section>
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          <a href="/" className="hover:text-stone-600">
            ← Retour à la réservation
          </a>
        </p>
      </main>
    </div>
  );
}
