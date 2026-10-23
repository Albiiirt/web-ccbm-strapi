'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::news.news', ({ strapi }) => ({
  async sendPressRelease(ctx) {
    const { id } = ctx.params;

    try {
      const result = await strapi.service('api::news.news').sendPressRelease(id);
      ctx.body = { data: result };
    } catch (err) {
      ctx.badRequest(err.message);
    }
  },
}));
