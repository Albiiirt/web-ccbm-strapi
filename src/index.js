'use strict';

/**
 * Accions de lectura pública que la web necessita per a cada content-type.
 * S'apliquen soles cada cop que arrenca Strapi (idempotent: no duplica si
 * ja existeixen) — així no cal anar manualment a Settings > Roles > Public
 * cada vegada que es recrea l'entorn.
 */
const PUBLIC_READ_ACTIONS = [
  'api::news.news.find',
  'api::news.news.findOne',
  'api::gallery-photo.gallery-photo.find',
  'api::gallery-photo.gallery-photo.findOne',
  'api::destacat.destacat.find',
  'api::destacat.destacat.findOne',
  'api::diada.diada.find',
  'api::diada.diada.findOne',
  'api::historia-event.historia-event.find',
  'api::historia-event.historia-event.findOne',
  'api::comissio.comissio.find',
  'api::comissio.comissio.findOne',
  'api::membre.membre.find',
  'api::membre.membre.findOne',
  'api::about.about.find',
];

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    for (const action of PUBLIC_READ_ACTIONS) {
      const existing = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: publicRole.id } });

      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: { action, role: publicRole.id },
        });
        strapi.log.info(`[bootstrap] permís públic afegit: ${action}`);
      }
    }
  },
};
