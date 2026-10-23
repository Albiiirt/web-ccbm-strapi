import { getFetchClient } from '@strapi/strapi/admin';

const config = {
  locales: [],
};

function showToast(message, isError) {
  const el = document.createElement('div');
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    background: isError ? '#B72B1A' : '#328048',
    color: '#fff',
    padding: '12px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    boxShadow: '0 4px 16px rgba(0,0,0,.3)',
    maxWidth: '360px',
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

const sendPressReleaseAction = ({ document, documentId, model }) => {
  if (model !== 'api::news.news') return null;
  if (!document?.publishedAt) return null;

  const alreadySent = Boolean(document?.pressReleaseSentAt);

  return {
    name: 'send-press-release',
    label: alreadySent ? 'Reenviar nota de premsa' : 'Enviar com a nota de premsa',
    position: 'panel',
    variant: alreadySent ? 'secondary' : 'success',
    dialog: {
      type: 'dialog',
      title: alreadySent ? 'Reenviar la nota de premsa?' : 'Enviar aquesta notícia com a nota de premsa?',
      content: alreadySent
        ? `Aquesta notícia ja es va enviar per MailerLite el ${new Date(document.pressReleaseSentAt).toLocaleString('ca-ES')}. Tornar a enviar-la farà arribar un email nou als mateixos grups.`
        : 'Això enviarà un email per MailerLite a totes les llistes configurades (seguidors i entitats/ajuntaments). No es pot desfer un cop enviat.',
    },
    onClick: async () => {
      const { post } = getFetchClient();
      try {
        await post(`/api/news/${documentId}/send-press-release`);
        showToast('Nota de premsa enviada correctament.');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        const message = err?.response?.data?.error?.message || err.message || 'Error desconegut';
        showToast(`No s'ha pogut enviar la nota de premsa: ${message}`, true);
      }
    },
  };
};

const bootstrap = (app) => {
  app.getPlugin('content-manager').apis.addDocumentAction((actions) => [
    ...actions,
    sendPressReleaseAction,
  ]);
};

export default {
  config,
  bootstrap,
};
