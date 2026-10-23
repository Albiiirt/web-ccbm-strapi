'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';

function buildPressReleaseHtml(entry) {
  const siteUrl = process.env.PUBLIC_SITE_URL || 'https://ccbaixmontseny.cat';
  const link = entry.url || siteUrl;
  const imageTag = entry.image?.url
    ? `<p><img src="${entry.image.url}" alt="" style="max-width:100%;" /></p>`
    : '';

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#B71C1C;">${entry.title}</h1>
      ${imageTag}
      <p>${entry.summary || ''}</p>
      <p><a href="${link}" style="color:#1A237E;">Llegir la notícia completa</a></p>
      <hr />
      <p style="font-size:12px;color:#666;">Colla Castellera del Baix Montseny — ${siteUrl}</p>
    </div>
  `.trim();
}

async function mailerliteRequest(path, options = {}) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Falta la variable d\'entorn MAILERLITE_API_KEY — cal configurar-la a Render abans de poder enviar notes de premsa.'
    );
  }

  const res = await fetch(`${MAILERLITE_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = body?.message || `MailerLite ha retornat l'error ${res.status}`;
    throw new Error(message);
  }

  return body;
}

module.exports = createCoreService('api::news.news', ({ strapi }) => ({
  async sendPressRelease(documentId) {
    const entry = await strapi.documents('api::news.news').findOne({
      documentId,
      populate: ['image'],
    });

    if (!entry) {
      throw new Error('No s\'ha trobat la notícia.');
    }

    if (!entry.publishedAt) {
      throw new Error('La notícia s\'ha de publicar abans de poder-la enviar com a nota de premsa.');
    }

    const groupIds = (process.env.MAILERLITE_GROUP_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (groupIds.length === 0) {
      throw new Error(
        'Falta la variable d\'entorn MAILERLITE_GROUP_IDS (IDs dels grups de MailerLite separats per comes).'
      );
    }

    const fromEmail = process.env.MAILERLITE_FROM_EMAIL;
    const fromName = process.env.MAILERLITE_FROM_NAME || 'Colla Castellera del Baix Montseny';

    if (!fromEmail) {
      throw new Error('Falta la variable d\'entorn MAILERLITE_FROM_EMAIL (adreça verificada a MailerLite).');
    }

    const campaign = await mailerliteRequest('/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: `Nota de premsa — ${entry.title} — ${new Date().toISOString()}`,
        type: 'regular',
        groups: groupIds,
        emails: [
          {
            subject: entry.title,
            from: fromEmail,
            from_name: fromName,
            content: buildPressReleaseHtml(entry),
          },
        ],
      }),
    });

    const campaignId = campaign?.data?.id;
    if (!campaignId) {
      throw new Error('MailerLite no ha retornat un ID de campanya vàlid.');
    }

    await mailerliteRequest(`/campaigns/${campaignId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ delivery: 'instant' }),
    });

    const sentAt = new Date().toISOString();

    await strapi.documents('api::news.news').update({
      documentId,
      data: { pressReleaseSentAt: sentAt },
    });

    return { sentAt, campaignId };
  },
}));
