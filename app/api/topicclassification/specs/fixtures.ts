import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

export const template1 = db.id();
export const e1 = db.id();
export const e2 = db.id();
export const dictionaryId = db.id();
export const moviesId = db.id();

export default {
  templates: <TemplateSchema[]>[
    {
      _id: template1,
      name: 'template1',
      commonProperties: [{ name: 'title', label: 'Title', type: propertyTypes.text }],
      default: true,
      properties: [
        { name: 'date', label: 'Date', type: propertyTypes.date },
        { name: 'text', label: 'Recommendation', type: propertyTypes.markdown },
        { name: 'movies', label: 'Movies', type: propertyTypes.multiselect, content: moviesId },
      ],
    },
  ],
  dictionaries: <ThesaurusSchema[]>[
    { _id: db.id(), name: 'dictionary' },
    {
      _id: dictionaryId,
      name: 'dictionary 2',
      values: [
        { id: '1', label: 'value 1' },
        { id: '2', label: 'value 2' },
      ],
    },
    {
      _id: moviesId,
      name: 'Top movies',
      enable_classification: true,
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
  entities: <EntitySchema[]>[
    {
      _id: e1,
      template: template1,
      sharedId: 'e1',
      title: 'title1',
      language: 'en',
      metadata: {
        text: [{ value: 'who am I? I am Batman.' }],
      },
    },
    {
      _id: e2,
      template: template1,
      sharedId: 'e2',
      title: 'title2',
      language: 'en',
      metadata: {
        movies: [{ value: '2.1', label: 'batman' }],
        text: [{ value: 'why? because I am Batman.' }],
      },
    },
  ],
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
  translations: [{ locale: 'en', contexts: [] }],
};
