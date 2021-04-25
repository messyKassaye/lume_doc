/** @format */

/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const batmanFinishesId = db.id();
const unpublishedId = db.id();
const syncPropertiesEntityId = db.id();
const templateId = db.id();
const userId = db.id();

export default {
  entities: [
    {
      _id: batmanFinishesId,
      sharedId: 'shared',
      template: templateId,
      language: 'en',
      title: 'Batman finishes',
      published: true,
      user: userId,
    },
    {
      _id: unpublishedId,
      sharedId: 'unpublished',
      template: db.id(),
      language: 'en',
      title: 'unpublished',
      published: false,
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: 'shared',
      language: 'es',
      title: 'Penguin almost done',
      creationDate: 1,
      published: true,
    },
    {
      _id: db.id(),
      sharedId: 'shared',
      language: 'pt',
      title: 'Penguin almost done',
      creationDate: 1,
      published: true,
      metadata: { text: [{ value: 'test' }] },
    },
    //select/multiselect/date sync
    {
      _id: syncPropertiesEntityId,
      template: templateId,
      sharedId: 'shared1',
      language: 'en',
      title: 'EN',
      published: true,
      metadata: { text: [{ value: 'text' }] },
    },
    {
      _id: db.id(),
      template: templateId,
      sharedId: 'shared1',
      language: 'es',
      title: 'ES',
      creationDate: 1,
      published: true,
      metadata: { text: [{ value: 'text' }] },
    },
    {
      _id: db.id(),
      template: templateId,
      sharedId: 'shared1',
      language: 'pt',
      title: 'PT',
      creationDate: 1,
      published: true,
      metadata: { text: [{ value: 'text' }] },
    },
  ],
  settings: [{ _id: db.id(), languages: [{ key: 'es' }, { key: 'pt' }, { key: 'en' }] }],
  templates: [
    {
      _id: templateId,
      name: 'template_test',
      properties: [
        { type: 'text', name: 'text', filter: true },
        { type: 'select', name: 'select', filter: true },
        { type: 'multiselect', name: 'multiselect', filter: true },
        { type: 'date', name: 'date', filter: true },
        { type: 'multidate', name: 'multidate', filter: true },
        { type: 'multidaterange', name: 'multidaterange', filter: true },
      ],
    },
  ],
};

export { batmanFinishesId, unpublishedId, syncPropertiesEntityId, templateId, userId };
