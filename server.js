// ============================================================
// CEDINORD — Serveur principal
// Point d'entrée de l'application Marketing Hub
// ============================================================

require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ---- Health check Railway ----
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Cedinord Marketing Hub' }));

// ---- Page principale : Marketing Hub ----
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ============================================================
// WEBHOOKS HUBSPOT
// ============================================================

// Nouveau contact créé dans HubSpot → SMS de bienvenue
app.post('/webhook/new-contact', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const event of events) {
      const contactId = event.objectId;
      if (!contactId) continue;
      const contact = await getHubSpotContact(contactId);
      if (contact?.phone) {
        const msg = `Bonjour ${contact.firstname}, bienvenue chez CEDINORD Tourcoing ! Réparation, PC reconditionnés, conseil. On vous attend : 03XXXXXXXX — STOP: 36111`;
        await sendSMS(contact.phone, msg);
        console.log(`[WEBHOOK] SMS bienvenue envoyé à ${contact.firstname} (${contact.phone})`);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('[WEBHOOK] Erreur new-contact:', err.message);
    res.sendStatus(500);
  }
});

// Ticket fermé → SMS "appareil prêt" + J+1 demande d'avis
app.post('/webhook/ticket-closed', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const event of events) {
      const ticketId = event.objectId;
      if (!ticketId) continue;
      const contact = await getContactFromTicket(ticketId);
      const appareil = event.properties?.subject?.split(' ')[1] || 'appareil';
      if (contact?.phone) {
        await sendSMS(contact.phone,
          `Bonjour ${contact.firstname}, votre ${appareil} est PRÊT chez CEDINORD Tourcoing ! Venez le récupérer. Ouvert 9h-19h. Tél: 03XXXXXXXX`
        );
        // J+1 : demande d'avis Google
        setTimeout(async () => {
          await sendSMS(contact.phone,
            `Bonjour ${contact.firstname}, merci de votre confiance chez CEDINORD ! Votre avis Google nous aide beaucoup : g.page/cedinord`
          );
        }, 24 * 60 * 60 * 1000);
        console.log(`[WEBHOOK] SMS "prêt" envoyé à ${contact.firstname}`);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('[WEBHOOK] Erreur ticket-closed:', err.message);
    res.sendStatus(500);
  }
});

// Envoi SMS manuel depuis l'interface
app.post('/api/sms/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone et message requis' });
  const result = await sendSMS(phone, message);
  res.json(result);
});

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

async function sendSMS(phone, message) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { success: false, error: 'BREVO_API_KEY manquante' };

  const numero = phone.replace(/\s/g, '').replace(/^0/, '+33');
  try {
    const resp = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'CEDINORD', recipient: numero, content: message, type: 'transactional' })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || 'Erreur Brevo');
    return { success: true, data };
  } catch (err) {
    console.error('[SMS] Erreur:', err.message);
    return { success: false, error: err.message };
  }
}

async function getHubSpotContact(contactId) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  const resp = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,phone,email`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await resp.json();
  return data.properties;
}

async function getContactFromTicket(ticketId) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  const resp = await fetch(
    `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}/associations/contacts`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await resp.json();
  const contactId = data.results?.[0]?.id;
  if (contactId) return getHubSpotContact(contactId);
  return null;
}

app.listen(PORT, () => {
  console.log(`\n✅ CEDINORD Marketing Hub démarré sur le port ${PORT}`);
  console.log(`   URL locale : http://localhost:${PORT}`);
  console.log(`   Health check : http://localhost:${PORT}/health\n`);
});
