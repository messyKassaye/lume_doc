import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

export const thesauri: ThesaurusSchema[] = [
  {
    _id: 'abc',
    name: 'thesaurus1',
    values: [
      { id: 'v1', label: 'V1' },
      { id: 'v2', label: 'V2' },
    ],
  },
];
export const templates: TemplateSchema[] = [
  {
    _id: 't1',
    name: 'template1',
    commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    properties: [{ name: 'opts', label: 'Opts', content: 'abc', type: 'multiselect' }],
  },
];
export const documents: EntitySchema[] = [
  {
    _id: 'e1i',
    template: 't1',
    sharedId: 'e1',
    metadata: { title: [{ value: 'Doc1' }], opts: [{ value: 'v1', label: 'V1' }] },
  },
  {
    _id: 'e2i',
    template: 't1',
    sharedId: 'e2',
    metadata: { title: [{ value: 'Doc2' }], opts: [{ value: 'v2', label: 'V2' }] },
  },
];
