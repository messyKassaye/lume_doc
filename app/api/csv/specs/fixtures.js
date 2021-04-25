import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { templateUtils } from 'api/templates';

const template1Id = db.id();
const thesauri1Id = db.id();
const thesauri2Id = db.id();
const templateToRelateId = db.id();

export default {
  templates: [
    {
      _id: templateToRelateId,
      name: 'template to relate',
      properties: [],
    },
    {
      _id: template1Id,
      name: 'base template',
      properties: [
        {
          type: propertyTypes.text,
          label: 'text label',
          name: templateUtils.safeName('text label'),
        },
        {
          type: propertyTypes.numeric,
          label: 'numeric label',
          name: templateUtils.safeName('numeric label'),
        },
        {
          type: propertyTypes.select,
          label: 'select label',
          name: templateUtils.safeName('select label'),
          content: thesauri1Id,
        },
        {
          type: 'non_defined_type',
          label: 'not defined type',
          name: templateUtils.safeName('not defined type'),
        },
        {
          type: propertyTypes.text,
          label: 'not configured on csv',
          name: templateUtils.safeName('not configured on csv'),
        },
        {
          type: propertyTypes.geolocation,
          label: 'geolocation',
          name: templateUtils.safeName('geolocation_geolocation'),
        },
      ],
    },
  ],

  dictionaries: [
    {
      _id: thesauri1Id,
      name: 'thesauri1',
      values: [
        {
          label: ' value4 ',
          id: db.id().toString(),
        },
      ],
    },
  ],

  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],

  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [],
    },
    {
      _id: db.id(),
      locale: 'es',
      contexts: [],
    },
  ],
};

export { template1Id, thesauri1Id, thesauri2Id, templateToRelateId };
