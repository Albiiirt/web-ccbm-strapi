'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/news/:id/send-press-release',
      handler: 'news.sendPressRelease',
      config: {
        // auth: false perquè aquesta ruta content-api no pot fer servir el
        // middleware d'auth del router "admin" — la comprovació real es fa
        // manualment al controlador (assertIsAuthenticatedAdmin).
        auth: false,
      },
    },
  ],
};
