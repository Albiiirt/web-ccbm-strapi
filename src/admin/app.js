import { getFetchClient } from '@strapi/strapi/admin';

const config = {
  locales: [],
};

const sendPressReleaseAction = ({ document, documentId, model }) => {
  console.log('[nota-premsa-debug]', { model, documentId, document });
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
        window.alert('Nota de premsa enviada correctament.');
        window.location.reload();
      } catch (err) {
        const message = err?.response?.data?.error?.message || err.message || 'Error desconegut';
        window.alert(`No s'ha pogut enviar la nota de premsa: ${message}`);
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
