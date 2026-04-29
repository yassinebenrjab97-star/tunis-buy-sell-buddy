# 🚀 Déploiement — tunis-buy-sell-buddy sur AWS EC2

## 🧱 Architecture réelle du projet

```
tunis-buy-sell-buddy/        ← Monorepo
├── src/                     ← Frontend React + Vite + TypeScript
├── supabase/                ← Backend-as-a-Service (Supabase cloud)
│   ├── functions/           ← Edge Functions (serverless)
│   └── migrations/          ← Schéma PostgreSQL
├── terraform/               ← Infrastructure AWS (EC2 + Nginx)
└── .github/workflows/       ← Pipeline CI/CD GitHub Actions
```

**Stack détectée automatiquement :**
| Composant | Technologie |
|-----------|------------|
| Frontend  | React 18 + Vite + TypeScript + Tailwind + Shadcn/UI |
| Backend   | Supabase (BaaS cloud — PostgreSQL + Auth + Storage + Edge Functions) |
| Maps      | Mapbox GL |
| Deploy    | EC2 t2.large + Ubuntu 24.04 + Nginx |
| Region    | us-east-1 (Virginia) |

---

## 📁 Fichiers à ajouter dans ton repo GitHub

```
ton-repo/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## 🔐 Étape 1 — Configurer les GitHub Secrets

Dans ton repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**

### Secrets AWS Academy (récupère-les depuis AWS Academy → AWS Details → Show)

| Secret | Valeur |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | `aws_access_key_id` depuis AWS Academy |
| `AWS_SECRET_ACCESS_KEY` | `aws_secret_access_key` depuis AWS Academy |
| `AWS_SESSION_TOKEN` | `aws_session_token` depuis AWS Academy |

> ⚠️ Les credentials AWS Academy expirent toutes les 4h. Renouvelle-les avant chaque déploiement.

### Secret clé SSH (pour se connecter à EC2)

1. Dans AWS Academy → EC2 → Key Pairs → télécharge `labsuser.pem`
2. Copie le contenu du fichier `.pem` (tout le contenu, avec les lignes `-----BEGIN...-----`)
3. Crée le secret :

| Secret | Valeur |
|--------|--------|
| `EC2_SSH_PRIVATE_KEY` | Contenu complet du fichier `labsuser.pem` |

### Secrets Supabase (variables de l'app)

| Secret | Valeur |
|--------|--------|
| `VITE_SUPABASE_URL` | `https://obatwlbgzgzufxeexcgf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | La clé anon depuis ton `.env` |
| `VITE_SUPABASE_PROJECT_ID` | `obatwlbgzgzufxeexcgf` |

---

## ☁️ Étape 2 — Lancer le pipeline

1. Pousse les fichiers `terraform/` et `.github/workflows/deploy.yml` sur la branche `main`
2. Va dans **GitHub → Actions** → tu verras le pipeline se lancer automatiquement
3. Les 3 jobs s'exécutent dans l'ordre :

```
Job1: ☁️ Provision EC2 (Terraform)    ─── ~3 min
          ↓
Job2: 📦 Installation prérequis        ─── ~2 min
          ↓
Job3: 🚀 Build React + Deploy Nginx    ─── ~3 min
```

---

## 🌐 Étape 3 — Accéder à l'application

À la fin du Job3, l'URL s'affiche dans les logs GitHub Actions :

```
════════════════════════════════════════
  ✅ DÉPLOIEMENT RÉUSSI !
════════════════════════════════════════
  🌐 URL de l'app : http://<ELASTIC_IP>
════════════════════════════════════════
```

Tu peux aussi retrouver l'IP dans :
- **AWS Console → EC2 → Instances → Elastic IP**
- **Terraform output** : `terraform output app_url`

---

## 🔄 Redeployer (mises à jour)

À chaque `git push` sur `main`, le pipeline se relance automatiquement :
- Terraform détecte qu'aucune infra n'a changé → skip EC2
- Job2 réinstalle les packages si nécessaire
- Job3 fait un `git pull` + rebuild + reload Nginx

---

## 🔧 Commandes utiles

```bash
# Se connecter à l'instance EC2
ssh -i ~/.ssh/labsuser.pem ubuntu@<ELASTIC_IP>

# Vérifier Nginx
sudo systemctl status nginx
sudo nginx -t

# Voir les logs Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Rebuild manuel sur l'instance
cd ~/tunis-buy-sell-buddy && npm run build
sudo systemctl reload nginx
```

---

## ❓ Dépannage fréquent

| Problème | Solution |
|----------|----------|
| `Error: InvalidClientTokenId` | Renouvelle tes credentials AWS Academy |
| SSH timeout au Job1 | L'instance démarre — attends 2 min et relance |
| Page blanche sur l'URL | Vérifie les secrets Supabase dans GitHub |
| `403 Forbidden` Nginx | Permissions du dossier `dist` → `sudo chmod -R o+r ~/tunis-buy-sell-buddy/dist` |
