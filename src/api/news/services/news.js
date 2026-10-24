'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';

// Colors/tipografia alineats amb app/globals.css de web-ccbm-next (--md-primary,
// --md-on-surface, --font-display, etc.) perquè la nota de premsa es vegi com la
// resta de la marca, no com un email genèric.
function buildPressReleaseHtml(entry) {
  const siteUrl = process.env.PUBLIC_SITE_URL || 'https://ccbaixmontseny.cat';
  // El botó només apareix si la notícia té un enllaç propi (camp url) — sense
  // ell no hi ha res concret a on portar el lector, ja que la secció Notícies
  // no es mostra a la web (veure project_web_ccbm).
  const link = entry.url || null;

  const imageRow = entry.image?.url
    ? `
    <tr>
      <td style="padding:0;">
        <img src="${entry.image.url}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
      </td>
    </tr>`
    : '';

  const ctaLabel = entry.ctaLabel || 'Llegir la notícia completa';
  const ctaRow = link
    ? `
        <tr>
          <td style="padding:0 32px 32px 32px;font-family:'Poppins',Helvetica,Arial,sans-serif;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td bgcolor="#01758C" style="border-radius:100px;">
                  <a href="${link}" style="display:block;padding:12px 24px;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;">${ctaLabel}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    : '';

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0F6F7;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 0 32px;font-family:'Poppins',Helvetica,Arial,sans-serif;">
            <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#01758C;">Nota de premsa</span>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 32px 20px 32px;font-family:'Poppins',Helvetica,Arial,sans-serif;border-bottom:1px solid #E3ECEE;">
            <span style="font-size:15px;font-weight:700;color:#1A1A1A;">Colla Castellera del Baix Montseny</span>
          </td>
        </tr>
        ${imageRow}
        <tr>
          <td style="padding:28px 32px 0 32px;font-family:'Poppins',Helvetica,Arial,sans-serif;">
            <h1 style="margin:0 0 14px 0;font-size:24px;line-height:1.3;color:#1A1A1A;">${entry.title}</h1>
            <p style="margin:0 0 ${link ? 24 : 28}px 0;font-size:15px;line-height:1.6;color:#4A5C60;">${entry.summary || ''}</p>
          </td>
        </tr>${ctaRow}
        <tr>
          <td style="padding:20px 32px 28px 32px;font-family:'Poppins',Helvetica,Arial,sans-serif;border-top:1px solid #E3ECEE;">
            <p style="margin:0;font-size:12px;color:#4A5C60;">Colla Castellera del Baix Montseny — <a href="${siteUrl}" style="color:#01758C;text-decoration:none;">${siteUrl.replace(/^https?:\/\//, '')}</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
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
  async sendPressRelease(documentId, { test = false } = {}) {
    const entry = await strapi.documents('api::news.news').findOne({
      documentId,
      status: 'published',
      populate: ['image'],
    });

    strapi.log.info('[nota-premsa-debug] image=' + JSON.stringify(entry?.image));

    if (!entry) {
      throw new Error('No s\'ha trobat la notícia.');
    }

    if (!entry.publishedAt) {
      throw new Error('La notícia s\'ha de publicar abans de poder-la enviar com a nota de premsa.');
    }

    let groupIds;
    if (test) {
      const testGroupId = process.env.MAILERLITE_TEST_GROUP_ID;
      if (!testGroupId) {
        throw new Error(
          'Falta la variable d\'entorn MAILERLITE_TEST_GROUP_ID (ID del grup "Proves" de MailerLite).'
        );
      }
      groupIds = [testGroupId];
    } else {
      groupIds = (process.env.MAILERLITE_GROUP_IDS || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (groupIds.length === 0) {
        throw new Error(
          'Falta la variable d\'entorn MAILERLITE_GROUP_IDS (IDs dels grups de MailerLite separats per comes).'
        );
      }
    }

    const fromEmail = process.env.MAILERLITE_FROM_EMAIL;
    const fromName = process.env.MAILERLITE_FROM_NAME || 'Colla Castellera del Baix Montseny';

    if (!fromEmail) {
      throw new Error('Falta la variable d\'entorn MAILERLITE_FROM_EMAIL (adreça verificada a MailerLite).');
    }

    const campaign = await mailerliteRequest('/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: `${test ? '[PROVA] ' : ''}Nota de premsa — ${entry.title} — ${new Date().toISOString()}`,
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

    // Un enviament de prova no marca la notícia com a "ja enviada" — aquesta
    // marca és només per al registre de l'enviament real a seguidors/entitats.
    if (test) {
      return { sentAt: null, campaignId, test: true };
    }

    const sentAt = new Date().toISOString();

    // update() només toca la versió draft; cal tornar a publicar perquè la
    // marca de "ja enviat" també arribi a la versió published (que és la que
    // llegim més amunt per decidir si cal avisar d'un reenviament).
    await strapi.documents('api::news.news').update({
      documentId,
      data: { pressReleaseSentAt: sentAt },
    });
    await strapi.documents('api::news.news').publish({ documentId });

    return { sentAt, campaignId, test: false };
  },
}));
