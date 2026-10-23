'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

/**
 * Rutes custom dins de src/api/* sempre es registren com a tipus "content-api"
 * (Strapi ho força internament), així que la policy admin::isAuthenticatedAdmin
 * mai hi funciona (depèn del middleware d'auth del router "admin"). Verifiquem
 * la sessió d'admin manualment reenviant el mateix token a l'endpoint propi de
 * Strapi que ja sap fer-ho.
 */
async function assertIsAuthenticatedAdmin(ctx) {
  const authHeader = ctx.request.header.authorization;
  if (!authHeader) {
    ctx.unauthorized();
    return false;
  }

  const port = strapi.config.get('server.port');
  const res = await fetch(`http://127.0.0.1:${port}/admin/users/me`, {
    headers: { authorization: authHeader },
  });

  if (!res.ok) {
    ctx.unauthorized();
    return false;
  }

  return true;
}

module.exports = createCoreController('api::news.news', ({ strapi }) => ({
  async sendPressRelease(ctx) {
    if (!(await assertIsAuthenticatedAdmin(ctx))) return;

    const { id } = ctx.params;

    try {
      const result = await strapi.service('api::news.news').sendPressRelease(id);
      ctx.body = { data: result };
    } catch (err) {
      ctx.badRequest(err.message);
    }
  },
}));
