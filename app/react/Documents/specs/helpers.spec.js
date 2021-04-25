/** @format */

import helpers from 'app/Documents/helpers.js';

describe('document helpers', () => {
  const templates = [
    { _id: '1', properties: [{ name: 'author', filter: false, type: 'text' }] },
    {
      _id: '2',
      name: 'template name',
      properties: [
        { name: 'author', type: 'text', label: 'authorLabel' },
        { name: 'country', type: 'select', content: 'abc1', label: 'countryLabel' },
        { name: 'badThesauri', type: 'select', content: 'abc1', label: 'badThesauri' },
        { name: 'language', type: 'text', label: 'languageLabel' },
        { name: 'date', type: 'date', label: 'dateLabel' },
      ],
    },
    {
      _id: '3',
      name: 'template name',
      properties: [
        { name: 'author', filter: false, type: 'text', label: 'authorLabel' },
        { name: 'uploaded', filter: true, type: 'date', label: 'dateLabel' },
      ],
    },
  ];

  const thesauris = [{ _id: 'abc1', values: [{ id: 'thesauriId', label: 'countryValue' }] }];

  const doc = {
    title: 'doc title',
    template: '2',
    metadata: {
      author: [{ value: 'authorValue' }],
      country: [{ value: 'thesauriId' }],
      badThesauri: [{ value: 'bad' }],
      language: [{ value: 'languageValue' }],
      date: [{ value: '1469729080' }],
    },
  };

  describe('prepareMetadata', () => {
    it('should prepare doc with document_type, metadata with label and thesauri values', () => {
      expect(helpers.prepareMetadata(doc, templates, thesauris)).toEqual({
        title: 'doc title',
        documentType: 'template name',
        template: '2',
        metadata: [
          { label: 'authorLabel', value: 'authorValue' },
          { label: 'countryLabel', value: 'countryValue' },
          { label: 'badThesauri', value: '' },
          { label: 'languageLabel', value: 'languageValue' },
          { label: 'dateLabel', value: 'Jul 28, 2016' },
        ],
      });
    });

    describe('when a select has no value', () => {
      it('should not throw an error', () => {
        doc.metadata.country = null;
        expect(helpers.prepareMetadata.bind(null, doc, templates, thesauris)).not.toThrow();
      });
    });

    describe('when no templates provided', () => {
      it('should return the document with empty metadata', () => {
        expect(helpers.prepareMetadata(doc, [], thesauris)).toEqual({
          title: 'doc title',
          template: '2',
          documentType: '',
          metadata: [],
        });
      });
    });
  });
});
