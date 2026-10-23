'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/news/:id/send-press-release',
      handler: 'news.sendPressRelease',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
  ],
};
