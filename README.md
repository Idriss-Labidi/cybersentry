# Cybersentry

Plateforme full-stack de cyber-vigilance combinee a des outils d'analyse de securite (DNS, IP, email, GitHub), avec authentification OAuth2/OIDC et tableau de bord web.

## Apercu du projet

Le projet est compose de deux applications principales :

- `cybersentry-backend/` : API REST Django (gestion utilisateurs, actifs, incidents, notifications, outils de securite)
- `cybersentry-frontend/` : interface React + TypeScript (landing, outils publics, dashboard protege)

## Stack technique

- **Backend** : Django, Django REST Framework, OAuth2 Toolkit (OIDC), Celery
- **Frontend** : React 19, TypeScript, Vite, Mantine
- **Base de donnees** : PostgreSQL
- **Cache / broker** : Redis

## Arborescence principale

```text
cybersentry/
├─ cybersentry-backend/
│  ├─ backend/                  # settings, urls, celery
│  ├─ accounts/                 # auth, profil, admin utilisateurs
│  ├─ assets/                   # actifs numeriques
│  ├─ incidents/                # tickets incidents
│  ├─ dns_tools/                # dns lookup/propagation/health
│  ├─ ip_tools/                 # whois/reputation/reverse/typosquatting
│  ├─ email_tools/              # SPF, DKIM, DMARC
│  ├─ github_health_check/      # evaluation de depots GitHub
│  ├─ notifications/            # centre de notifications
│  └─ oidc_provider/            # extension OIDC
├─ cybersentry-frontend/
│  └─ src/
│     ├─ pages/                 # pages landing + dashboard
│     ├─ components/            # composants reutilisables
│     ├─ context/               # auth/theme
│     ├─ layouts/               # layouts landing/dashboard
│     └─ utils/                 # axios + OIDC user manager
├─ docs/
│  └─ rendu_final.md            # source du document de rendu final
└─ requirements.txt
```

## Prerequis

- Python 3.11+
- Node.js 20+
- npm 10+
- PostgreSQL 14+
- Redis 6+

## Installation et lancement

### 1) Backend

```powershell
Set-Location "D:\IGL3 - D desk\Proj App Nouv Tech 2\cybersentry"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Set-Location ".\cybersentry-backend"
python manage.py migrate
python manage.py runserver 8000
```

Variables d'environnement backend (`cybersentry-backend/.env`) minimales :

- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `OIDC_RSA_PRIVATE_KEY`
- `GITHUB_TOKEN` (optionnel mais recommande pour limiter le rate-limit API GitHub)
- `CELERY_BROKER_URL` (si Celery/Redis actif)

### 2) Frontend

Dans un deuxieme terminal :

```powershell
Set-Location "D:\IGL3 - D desk\Proj App Nouv Tech 2\cybersentry\cybersentry-frontend"
npm install
npm run dev -- --port 3000
```

Variables frontend (`cybersentry-frontend/.env.local`) :

- `VITE_API_URL` (ex: `http://localhost:8000`)
- `VITE_OIDC_AUTHORITY` (ex: `http://localhost:8000/o`)
- `VITE_OIDC_CLIENT_ID`
- `VITE_OIDC_REDIRECT_URI` (ex: `http://localhost:3000/oauth-callback`)
- `VITE_OIDC_SCOPES` (ex: `openid profile email`)

## Taches asynchrones (optionnel mais recommande)

Pour les jobs Celery (checks automatises), lancer en plus :

```powershell
Set-Location "D:\IGL3 - D desk\Proj App Nouv Tech 2\cybersentry\cybersentry-backend"
celery -A backend worker -l info
celery -A backend beat -l info
```

## Endpoints et modules majeurs

- `api/assets/` : gestion des actifs
- `api/incidents/` : gestion des incidents
- `api/notifications/` : evenements/notifications
- `dns-tools/` : outils DNS
- `ip-tools/` : outils IP/domaine
- `email-tools/` : analyse securite email
- `github-health/` : controle de sante GitHub
- `o/` + `oidc/` : OAuth2/OIDC

## Guide utilisateur rapide

1. Ouvrir `http://localhost:3000`
2. Se connecter (OIDC)
3. Consulter le tableau de bord
4. Utiliser les modules selon le besoin : actifs, incidents, DNS/IP/Email, GitHub

## Lien GitHub

- Depot : **[A COMPLETER - URL GitHub du groupe]**

## Bonnes pratiques pour le rendu final

- Ne pas versionner de secrets (`.env`, tokens API, cles privees)
- Verifier que le depot est propre et lisible
- Conserver seulement les fichiers utiles au projet
- Documenter clairement les prerequis et etapes de lancement

