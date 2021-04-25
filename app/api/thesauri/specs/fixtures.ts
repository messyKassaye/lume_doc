import { DBFixture, testingDB } from 'api/utils/testing_db';

const entityTemplateId = '589af97080fc0b23471d67f3';
const dictionaryId = '589af97080fc0b23471d67f4';
const dictionaryIdToTranslate = '589af97080fc0b23471d67f5';
const dictionaryWithValueGroups = testingDB.id();
const dictionaryValueId = '1';

const fixtures: DBFixture = {
  dictionaries: [
    { _id: testingDB.id(), name: 'dictionary' },
    {
      _id: testingDB.id(dictionaryId),
      name: 'dictionary 2',
      values: [
        { id: '1', label: 'value 1' },
        { id: '2', label: 'value 2' },
      ],
    },
    {
      _id: testingDB.id(dictionaryIdToTranslate),
      name: 'Top 2 scify books',
      values: [
        { id: dictionaryValueId, label: 'Enders game' },
        { id: '2', label: 'Fundation' },
      ],
    },
    {
      _id: dictionaryWithValueGroups,
      name: 'Top movies',
      values: [
        {
          id: '1',
          label: 'scy fi',
          values: [
            { id: '1.1', label: 'groundhog day' },
            { id: '1.2', label: 'terminator 2' },
          ],
        },
        {
          id: '2',
          label: 'superheros',
          values: [
            { id: '2.1', label: 'batman' },
            { id: '2.2', label: 'spiderman' },
          ],
        },
        { id: '3', label: 'single value' },
      ],
    },
  ],
  templates: [
    {
      _id: testingDB.id(entityTemplateId),
      name: 'entityTemplate',
      properties: [
        {
          type: 'multiselect',
          name: 'multiselect',
          content: dictionaryId,
        },
      ],
    },
    { _id: testingDB.id(), name: 'documentTemplate', properties: [{}] },
  ],
  entities: [
    {
      _id: testingDB.id(),
      sharedId: 'sharedId2',
      language: 'es',
      template: testingDB.id(entityTemplateId),
      metadata: {
        multiselect: [{ value: '1', label: '1' }],
      },
    },
    {
      _id: testingDB.id(),
      sharedId: 'sharedId',
      title: 'english entity',
      language: 'en',
      template: testingDB.id(entityTemplateId),
      icon: { type: 'Icon' },
      metadata: {
        multiselect: [{ value: '1', label: '1' }],
      },
    },
    {
      _id: testingDB.id(),
      sharedId: 'sharedId',
      title: 'spanish entity',
      language: 'es',
      template: testingDB.id(entityTemplateId),
      icon: { type: 'Icon' },
      published: true,
      metadata: {
        multiselect: [
          { value: '1', label: '1' },
          { value: '2', label: 'value 2' },
        ],
      },
    },
    {
      _id: testingDB.id(),
      sharedId: 'other',
      type: 'entity',
      title: 'unpublished entity',
      language: 'es',
      template: testingDB.id(entityTemplateId),
      published: false,
    },
  ],
  settings: [{ _id: testingDB.id(), languages: [{ key: 'es', default: true }] }],
  translations: [
    {
      _id: testingDB.id(),
      locale: 'en',
      contexts: [
        {
          id: dictionaryId,
          type: 'Dictionary',
          values: [
            { key: 'dictionary 2', value: 'dictionary 2' },
            { key: 'value 1', value: 'value 1' },
            { key: 'value 2', value: 'value 2' },
          ],
        },
      ],
    },
  ],
};

export {
  fixtures,
  dictionaryId,
  dictionaryIdToTranslate,
  dictionaryValueId,
  dictionaryWithValueGroups,
};
