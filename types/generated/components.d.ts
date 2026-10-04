import type { Schema, Struct } from '@strapi/strapi';

export interface AboutPrincipal extends Struct.ComponentSchema {
  collectionName: 'components_about_principals';
  info: {
    displayName: 'Principal';
    icon: 'feather';
  };
  attributes: {
    text: Schema.Attribute.Text;
    titol: Schema.Attribute.String;
  };
}

export interface AboutStat extends Struct.ComponentSchema {
  collectionName: 'components_about_stats';
  info: {
    displayName: 'Stat';
    icon: 'chart-bar';
  };
  attributes: {
    numero: Schema.Attribute.Integer;
    prefix: Schema.Attribute.String;
    titol: Schema.Attribute.String;
  };
}

export interface AboutValor extends Struct.ComponentSchema {
  collectionName: 'components_about_valors';
  info: {
    displayName: 'Valor';
    icon: 'star';
  };
  attributes: {
    icona: Schema.Attribute.String & Schema.Attribute.DefaultTo<'star'>;
    text: Schema.Attribute.Text;
    titol: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'about.principal': AboutPrincipal;
      'about.stat': AboutStat;
      'about.valor': AboutValor;
    }
  }
}
