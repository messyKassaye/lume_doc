import documentProperties from './document_properties';
import { textSortField } from './mappings';

const properties = {
  documents: documentProperties,
  '@timestamp': { type: 'date', doc_values: true },
  '@version': { type: 'text', index: false },
  fullText: { type: 'join', relations: { entity: 'fullText' } },
  title: {
    type: 'text',
    index: true,
    analyzer: 'other',
    fields: {
      sort: textSortField,
      sayt: { type: 'search_as_you_type' },
    },
    term_vector: 'with_positions_offsets',
  },
  creationDate: {
    type: 'date',
    format: 'epoch_millis',
    fields: {
      raw: { type: 'date', index: false },
      sort: { type: 'date' },
    },
  },
  editDate: {
    type: 'date',
    format: 'epoch_millis',
    fields: {
      raw: { type: 'date', index: false },
      sort: { type: 'date' },
    },
  },
  attachments: {
    type: 'object',
    enabled: false,
  },
  icon: {
    type: 'object',
    enabled: false,
  },
  toc: {
    type: 'object',
    enabled: false,
  },
  language: {
    type: 'keyword',
  },
  published: {
    type: 'keyword',
  },
  sharedId: {
    type: 'keyword',
    fields: {
      raw: { type: 'keyword' },
      sort: { type: 'keyword' },
    },
  },
  template: {
    type: 'keyword',
    fields: {
      raw: { type: 'keyword' },
      sort: { type: 'keyword' },
    },
  },
  generatedToc: {
    type: 'keyword',
  },
  type: {
    type: 'keyword',
  },
  user: {
    type: 'keyword',
  },
};

export default properties;
