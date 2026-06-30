# Resa O Loft — plateforme de réservation de l'open space

Application web de réservation de postes en open space pour **Le Loft**.

- **Côté client** (public, sans compte) : choix d'une date, d'un créneau (journée / matin / après-midi), formulaire, confirmation immédiate + email.
- **Côté gestion** (`/admin`, protégé par mot de passe) : toutes les réservations, réglage de la capacité, fermeture de jours, annulation, export CSV.

Construit avec **Next.js**, **Prisma** et **Tailwind CSS**.

---

## 1. Lancer l'application sur votre ordinateur

> Node.js est déjà installé. Ouvrez un terminal **dans le dossier du projet**
> (`C:\Users\Utilisateur\Resa-O-Loft`).

```bash
npm run dev
```

Puis ouvrez votre navigateur :

- Site de réservation → **http://localhost:3000**
- Espace de gestion → **http://localhost:3000/admin**

Pour arrêter : `Ctrl + C` dans le terminal.

> **Première fois uniquement** (déjà fait à l'installation) :
> ```bash
> npm install
> npm run db:push   # crée la base de données
> npm run db:seed   # initialise les paramètres
> ```

---

## 2. Réglages importants

Le fichier **`.env`** (à la racine du projet) contient la configuration. Ouvrez-le
avec le Bloc-notes pour modifier :

| Réglage | Rôle |
|---|---|
| `ADMIN_PASSWORD` | **Mot de passe de l'espace de gestion.** À changer (`loft2026` par défaut). |
| `SESSION_SECRET` | Chaîne secrète qui sécurise la connexion admin. Mettez une longue suite de caractères au hasard. |
| `NEXT_PUBLIC_SITE_NAME` | Nom affiché sur le site (« Le Loft »). |
| `RESEND_API_KEY` | Clé pour l'envoi des emails (voir §3). Vide = pas d'email. |

> La **capacité** (nombre de postes), les **types de créneaux** et les **fermetures**
> se règlent directement dans l'espace de gestion, onglets *Paramètres* et *Fermetures*
> — pas besoin de toucher au code.

Après toute modification du `.env`, arrêtez (`Ctrl + C`) et relancez `npm run dev`.

---

## 3. Activer les emails de confirmation

Par défaut, le client voit sa confirmation à l'écran. Pour qu'il reçoive aussi un **email** :

1. Créez un compte gratuit sur **https://resend.com**.
2. Dans Resend → *API Keys* → créez une clé, copiez-la.
3. Collez-la dans `.env` : `RESEND_API_KEY="re_..."`.
4. Pour tester tout de suite, gardez `EMAIL_FROM="Le Loft <onboarding@resend.dev>"`.
   Pour envoyer depuis votre propre adresse (`reservation@votredomaine.fr`), vérifiez
   votre domaine dans Resend (*Domains*) puis mettez cette adresse dans `EMAIL_FROM`.
5. (Optionnel) `EMAIL_ADMIN_NOTIFY="vous@votredomaine.fr"` pour recevoir une copie de
   chaque nouvelle réservation.

Si la clé est absente ou invalide, la réservation **fonctionne quand même** (juste sans email).

---

## 4. Mettre le site en ligne (accessible par lien)

Pour que vos clients y accèdent depuis n'importe où, il faut **héberger** l'application.
La voie la plus simple et gratuite : **Vercel** (hébergement) + **Neon** (base de données).

### a) Base de données en ligne (Neon — gratuit)

1. Créez un compte sur **https://neon.tech** et un projet (région *Europe*).
2. Copiez la **chaîne de connexion** Postgres (commence par `postgresql://…`).
3. Dans le fichier **`prisma/schema.prisma`**, remplacez :
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   par :
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Créez les tables dans Neon (une seule fois), depuis votre ordinateur :
   ```bash
   # collez l'URL Neon à la place de l'exemple
   $env:DATABASE_URL="postgresql://...neon.tech/..."   # PowerShell
   npx prisma db push
   npm run db:seed
   ```

### b) Hébergement (Vercel — gratuit)

1. Créez un compte sur **https://vercel.com**.
2. Mettez le projet sur GitHub (voir §5), puis dans Vercel : *Add New → Project* et
   importez le dépôt. (Ou installez `npm i -g vercel` puis lancez `vercel` dans le dossier.)
3. Dans Vercel → *Settings → Environment Variables*, ajoutez :
   - `DATABASE_URL` = votre URL Neon
   - `ADMIN_PASSWORD` = votre mot de passe
   - `SESSION_SECRET` = une longue chaîne aléatoire
   - `RESEND_API_KEY`, `EMAIL_FROM` (si emails)
   - `NEXT_PUBLIC_SITE_NAME` = `Le Loft`
4. *Deploy*. Vercel vous donne un lien public (ex. `https://resa-o-loft.vercel.app`)
   à partager avec vos clients. L'admin reste sur `…/admin`.

> À chaque modification poussée sur GitHub, Vercel redéploie automatiquement.

---

## 5. Sauvegarder le code sur GitHub (recommandé)

```bash
git add .
git commit -m "Resa O Loft"
# créez un dépôt vide sur github.com, puis :
git remote add origin https://github.com/VOTRE-COMPTE/resa-o-loft.git
git push -u origin main
```

---

## 6. Utilisation au quotidien (espace de gestion)

- **Réservations** : liste filtrable (à venir / historique / toutes), recherche,
  annulation, suppression, **export CSV** (s'ouvre dans Excel).
- **Paramètres** : nombre de postes, journée et/ou demi-journées, ouverture le week-end,
  horizon de réservation.
- **Fermetures** : bloquez un jour (férié, congés, privatisation) — il devient
  non réservable côté client.

---

## Aide-mémoire des commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Lance l'app en local (développement). |
| `npm run build` | Vérifie et prépare la version de production. |
| `npm run start` | Lance la version de production (après `build`). |
| `npm run db:studio` | Ouvre une interface visuelle de la base de données. |

---

## Structure du projet

```
src/
  app/
    page.tsx              → page publique de réservation
    admin/page.tsx        → espace de gestion
    api/                  → routes serveur (dispos, réservations, admin)
  components/             → calendrier, formulaire, tableau de bord
  lib/                    → logique métier (disponibilité, auth, emails, dates)
prisma/
  schema.prisma          → modèle de la base de données
```
