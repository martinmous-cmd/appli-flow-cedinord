# Cedinord — Marketing Hub

Application web de gestion marketing multicanal pour la boutique Cedinord, Tourcoing.

## Structure des fichiers

```
cedinord-marketing-hub/
├── server.js          ← Serveur principal + webhooks HubSpot
├── package.json       ← Dépendances Node.js
├── railway.toml       ← Configuration déploiement Railway
├── .env.example       ← Modèle des variables d'environnement
├── .gitignore         ← Fichiers à ne pas committer
└── public/
    └── index.html     ← Interface Marketing Hub (accessible depuis navigateur)
```

## Déploiement en 5 étapes

1. Créer un dépôt GitHub et uploader ces fichiers
2. Aller sur railway.app → New Project → Deploy from GitHub
3. Sélectionner votre dépôt
4. Ajouter les variables d'environnement (BREVO_API_KEY, HUBSPOT_ACCESS_TOKEN)
5. Votre URL sera disponible dans Railway → Settings → Domains

## Variables d'environnement requises

| Variable | Où la trouver |
|----------|--------------|
| BREVO_API_KEY | Brevo → Paramètres → Clés API → Transactional SMS |
| HUBSPOT_ACCESS_TOKEN | HubSpot → Paramètres → Intégrations → Applications privées |
| HUBSPOT_PORTAL_ID | 148341127 (votre portal ID) |

## Webhooks HubSpot à configurer

Après déploiement, configurer dans HubSpot → Paramètres → Intégrations → Webhooks :

- Contact créé → https://VOTRE-URL.railway.app/webhook/new-contact
- Ticket fermé → https://VOTRE-URL.railway.app/webhook/ticket-closed

## Coût mensuel estimé

- Railway : 0–5€/mois
- Brevo SMS (500 SMS) : ~7€/mois
- Total : ~13€/mois
