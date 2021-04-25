/* eslint-disable max-statements */

import Immutable from 'immutable';

import { metadataSelectors } from '../../selectors';

import formater from '../formater';
import { doc, templates, thesauris, relationships } from './fixtures';

describe('metadata formater', () => {
  function assessBasicProperties(element, [label, name, translateContext, value]) {
    expect(element.label).toBe(label);
    expect(element.name).toBe(name);
    expect(element.translateContext).toBe(translateContext);

    if (value) {
      expect(element.value).toEqual(value);
    }
  }

  function assessMultiValues(element, values, secondaryDepth) {
    values.forEach((val, index) => {
      const value = secondaryDepth ? element.value[index].value : element.value[index];
      expect(value).toEqual(val);
    });
  }

  describe('prepareMetadata', () => {
    let data;
    let text;
    let date;
    let multiselect;
    let multidate;
    let daterange;
    let multidaterange;
    let markdown;
    let select;
    let relationship1;
    let relationship2;
    let relationship3;
    let relationship4;
    let image;
    let preview;
    let media;
    let geolocation;
    let nested;
    let link;

    beforeAll(() => {
      data = formater.prepareMetadata(
        doc,
        templates,
        metadataSelectors.indexedThesaurus({ thesauris }),
        relationships
      );
      [
        text,
        date,
        multiselect,
        multidate,
        daterange,
        multidaterange,
        markdown,
        select,
        image,
        preview,
        media,
        relationship1,
        relationship2,
        relationship3,
        relationship4,
        geolocation,
        nested,
        link,
      ] = data.metadata;
    });

    const formatValue = value => ({
      icon: undefined,
      url: `/entity/${value.toLowerCase().replace(/ /g, '')}`,
      value,
    });

    it('should maintain doc original data untouched', () => {
      expect(data.title).toBe(doc.title);
      expect(data.template).toBe(doc.template);
    });

    it('should process all metadata', () => {
      expect(data.metadata.length).toEqual(18);
    });

    it('should process text type', () => {
      assessBasicProperties(text, ['Text', 'text', 'templateID', 'text content']);
    });

    it('should process date type', () => {
      assessBasicProperties(date, ['Date', 'date', 'templateID']);
      expect(date.value).toContain('1970');
    });

    it('should process multiselect type', () => {
      assessBasicProperties(multiselect, ['Multiselect', 'multiselect', 'templateID']);
      expect(multiselect.value.length).toBe(3);
      assessMultiValues(multiselect, ['Value 1', 'Value 2', 'Value 5'], true);
    });

    it('should process multidate type', () => {
      assessBasicProperties(multidate, ['Multi Date', 'multidate', 'templateID']);
      assessMultiValues(multidate, [
        { timestamp: 10, value: 'Jan 1, 1970' },
        { timestamp: 1000000, value: 'Jan 12, 1970' },
      ]);
      expect(multidate.label).toBe('Multi Date');
      expect(multidate.name).toBe('multidate');
      expect(multidate.value[0]).toEqual({ timestamp: 10, value: 'Jan 1, 1970' });
      expect(multidate.value[1]).toEqual({ timestamp: 1000000, value: 'Jan 12, 1970' });
    });

    it('should process daterange type', () => {
      assessBasicProperties(daterange, [
        'Date Range',
        'daterange',
        'templateID',
        'Jan 1, 1970 ~ Jan 12, 1970',
      ]);
    });

    it('should process multidaterange type', () => {
      assessBasicProperties(multidaterange, ['Multi Date Range', 'multidaterange', 'templateID']);
      assessMultiValues(
        multidaterange,
        ['Jan 1, 1970 ~ Jan 12, 1970', 'Jan 24, 1970 ~ Feb 4, 1970'],
        true
      );
    });

    it('should process markdown type', () => {
      assessBasicProperties(markdown, ['Mark Down', 'markdown', 'templateID', 'markdown content']);
      expect(markdown.type).toBe('markdown');
    });

    it('should process nested type', () => {
      assessBasicProperties(nested, ['Nested', 'nested', 'templateID']);
      expect(nested.type).toBe('markdown');
      expect(nested.value).toContain('nestedKey');
    });

    it('should process select type', () => {
      assessBasicProperties(select, ['Select', 'select', 'templateID', 'Value 5']);
    });

    it('should process bound relationship types', () => {
      assessBasicProperties(relationship1, ['Relationship', 'relationship1', 'templateID']);
      expect(relationship1.value.length).toBe(2);
      assessMultiValues(relationship1, [formatValue('Value 1'), formatValue('Value 2')]);
    });

    it('should process free relationship types', () => {
      assessBasicProperties(relationship2, ['Relationship 2', 'relationship2', 'templateID']);
      expect(relationship2.value.length).toBe(3);
      assessMultiValues(relationship2, [
        formatValue('Value 1'),
        formatValue('Value 2'),
        formatValue('Value 4'),
      ]);
    });

    describe('Inherit relationships', () => {
      it('should process inherit relationship types', () => {
        assessBasicProperties(relationship3, ['Relationship 3', 'text', 'template2']);
        expect(relationship3.value.length).toBe(3);
        assessMultiValues(relationship3, [{ value: 'how' }, { value: 'are' }, { value: 'you?' }]);
      });

      it('should not fail when inherited property is undefined', () => {
        const emptyDoc = {
          _id: 'languageSpecificId',
          template: 'templateID',
          title: 'Rude awakening',
          metadata: {},
        };

        expect(() =>
          formater.prepareMetadata(emptyDoc, templates, thesauris, relationships)
        ).not.toThrow();
      });

      it('should append the translated entity title to certain values', () => {
        assessBasicProperties(relationship4, ['Relationship 4', 'home_geolocation', 'template2']);
        expect(relationship4.value.length).toBe(3);
        assessMultiValues(relationship4, [
          { lat: 13, lon: 7, label: 'Entity 1 Title' },
          { lat: 5, lon: 10, label: 'Entity 2 Title (exisitng label)' },
          { lat: 23, lon: 8, label: 'Entity 2 Title (another label)' },
        ]);
      });
    });

    it('should process geolocation type', () => {
      assessBasicProperties(geolocation, ['Geolocation', 'geolocation', 'templateID']);
      expect(geolocation.value.length).toBe(2);
    });

    it('should process multimedia types', () => {
      expect(image.value).toBe('imageURL');
      expect(image.style).toBe('cover');
      expect(image.noLabel).toBe(true);
      expect(image.showInCard).toBe(true);

      expect(preview.type).toBe('image');
      expect(preview.value).toBe('/api/files/doc2.jpg');
      expect(preview.style).toBe('contain');
      expect(preview.noLabel).toBe(false);
      expect(preview.showInCard).toBe(true);

      expect(media.value).toBe('mediaURL');
      expect(media.noLabel).toBe(false);
      expect(media.showInCard).toBe(true);
    });

    it('should process link type', () => {
      expect(link).toEqual(
        expect.objectContaining({
          value: { label: 'link label', url: 'link url' },
          type: 'link',
        })
      );
    });

    it('should not fail when field do not exists on the document', () => {
      const clonedMetadata = Object.keys(doc.metadata).reduce(
        (memo, property) => ({ ...memo, [property]: doc.metadata[property] }),
        {}
      );

      const docCopy = { ...doc, metadata: clonedMetadata };

      docCopy.metadata.relationship1 = null;
      docCopy.metadata.multiselect = null;
      docCopy.metadata.select = null;
      docCopy.metadata.link = null;

      expect(() =>
        formater.prepareMetadata(docCopy, templates, thesauris, relationships)
      ).not.toThrow();
    });

    it('should include the name of template', () => {
      expect(data.documentType).toBe('Mecanismo');
    });
  });

  describe('prepareMetadataForCard', () => {
    let data;

    let text;
    let markdown;
    let creationDate;
    let editDate;
    let image;
    let preview;
    let media;
    let geolocation;
    let link;

    beforeAll(() => {
      data = formater.prepareMetadataForCard(doc, templates, thesauris);
      [text, markdown, image, preview, media, geolocation, link] = data.metadata;
    });

    it('should process text type', () => {
      assessBasicProperties(text, ['Text', 'text', 'templateID', 'text content']);
    });

    it('should process markdown type', () => {
      assessBasicProperties(markdown, ['Mark Down', 'markdown', 'templateID', 'markdown content']);
    });

    it('should process multimedia type', () => {
      assessBasicProperties(image, ['Image', 'image', 'templateID', 'imageURL']);
      assessBasicProperties(preview, [
        'PDFPreview',
        'preview',
        'templateID',
        '/api/files/doc2.jpg',
      ]);
      assessBasicProperties(media, ['Media', 'media', 'templateID', 'mediaURL']);
    });

    it('should return empty value preview if no PDF associated to the entity', () => {
      const adaptedEntity = { ...doc, defaultDoc: undefined, documents: [] };
      const formatted = formater.prepareMetadata(
        adaptedEntity,
        templates,
        thesauris,
        relationships
      );

      const previewField = formatted.metadata.find(field => field.name === 'preview');

      expect(previewField.value).toBeNull();
    });

    it('should not include the preview field if excludePreview passed', () => {
      const formatted = formater.prepareMetadata(
        doc,
        templates,
        metadataSelectors.indexedThesaurus({ thesauris }),
        relationships,
        { excludePreview: true }
      );

      const previewField = formatted.metadata.find(field => field.name === 'preview');

      expect(previewField).toBeUndefined();
    });

    it('should process geolocation type', () => {
      assessBasicProperties(geolocation, [
        'Geolocation',
        'geolocation',
        'templateID',
        [
          { lat: 2, lon: 3 },
          { label: 'home', lat: 13, lon: 7 },
        ],
      ]);
      expect(geolocation.onlyForCards).toBe(true);
    });

    it('should process link type', () => {
      expect(link).toEqual(
        expect.objectContaining({
          value: { label: 'link label', url: 'link url' },
          type: 'link',
        })
      );
    });

    describe('when sort property passed', () => {
      let date;
      const prepareMetadata = dateString =>
        formater.prepareMetadataForCard(doc, templates, thesauris, dateString).metadata;
      it('should process also the sorted property even if its not a "showInCard"', () => {
        data = formater.prepareMetadataForCard(doc, templates, thesauris, 'metadata.date');
        [text, date, markdown] = data.metadata;
        assessBasicProperties(date, ['Date', 'date', 'templateID']);
        expect(data.metadata.length).toEqual(8);
        expect(date.value).toContain('1970');
      });

      it('should add sortedBy true to the property being sorted', () => {
        data = formater.prepareMetadataForCard(doc, templates, thesauris, 'metadata.date');
        [text, date, markdown] = data.metadata;
        expect(date.sortedBy).toBe(true);
        expect(text.sortedBy).toBe(false);
        expect(markdown.sortedBy).toBe(false);
      });

      describe('when sort property has no value', () => {
        it('should add No Value key and translateContext system to the property', () => {
          doc.metadata.date = '';
          data = formater.prepareMetadataForCard(doc, templates, thesauris, 'metadata.date');
          [text, date] = data.metadata;
          expect(date.value).toBe('No value');
          expect(date.translateContext).toBe('System');
        });
      });

      describe('when sort property is creationDate', () => {
        it('should add it as a value to show', () => {
          [
            text,
            markdown,
            image,
            preview,
            media,
            geolocation,
            link,
            creationDate,
          ] = prepareMetadata('creationDate');
          expect(text.sortedBy).toBe(false);
          expect(markdown.sortedBy).toBe(false);
          assessBasicProperties(creationDate, [
            'Date added',
            'creationDate',
            'System',
            'Jan 1, 1970',
          ]);
          expect(creationDate.sortedBy).toBe(true);
        });
      });

      describe('when sort property is editDate', () => {
        it('should add it as a value to show', () => {
          [text, markdown, image, preview, media, geolocation, link, editDate] = prepareMetadata(
            'editDate'
          );
          expect(text.sortedBy).toBe(false);
          expect(markdown.sortedBy).toBe(false);
          assessBasicProperties(editDate, ['Date modified', 'editDate', 'System', 'Jan 1, 1970']);
          expect(editDate.sortedBy).toBe(true);
        });
      });

      describe('when sort property does not exists in the metadata', () => {
        it('should return a property with null as value', () => {
          const _templates = templates.push(
            Immutable.fromJS({
              _id: 'otherTemplate',
              properties: [{ name: 'nonexistent', type: 'date', label: 'NonExistentLabel' }],
            })
          );

          data = formater.prepareMetadataForCard(
            doc,
            _templates,
            thesauris,
            'metadata.nonexistent'
          );
          const nonexistent = data.metadata.find(p => p.name === 'nonexistent');
          assessBasicProperties(nonexistent, ['NonExistentLabel', 'nonexistent', 'otherTemplate']);
          expect(nonexistent.type).toBe(null);
        });

        it('should ignore non metadata properties', () => {
          const _templates = templates.push(
            Immutable.fromJS({
              properties: [{ name: 'nonexistent', type: 'date', label: 'NonExistentLabel' }],
            })
          );

          data = formater.prepareMetadataForCard(doc, _templates, thesauris, 'nonexistent');
          const nonexistent = data.metadata.find(p => p.name === 'nonexistent');
          expect(nonexistent).not.toBeDefined();
        });
      });
    });
  });

  describe('formatMetadata selector', () => {
    it('should use formater.prepareMetadata', () => {
      spyOn(formater, 'prepareMetadata').and.returnValue({ metadata: 'metadataFormated' });
      const state = {
        templates,
        thesauris,
        settings: Immutable.fromJS({ languages: [{ key: 'es', default: true }] }),
      };
      const metadata = metadataSelectors.formatMetadata(state, doc, null, relationships);
      expect(metadata).toBe('metadataFormated');
      expect(formater.prepareMetadata).toHaveBeenCalledWith(
        doc,
        templates,
        metadataSelectors.indexedThesaurus(state),
        relationships,
        undefined
      );
    });

    it('should exclude preview if option passed', () => {
      spyOn(formater, 'prepareMetadata').and.returnValue({ metadata: 'metadataFormated' });
      const state = {
        templates,
        thesauris,
        settings: Immutable.fromJS({ languages: [{ key: 'es', default: true }] }),
      };
      const metadata = metadataSelectors.formatMetadata(state, doc, null, relationships, {
        excludePreview: true,
      });
      expect(metadata).toBe('metadataFormated');
      expect(formater.prepareMetadata).toHaveBeenCalledWith(
        doc,
        templates,
        metadataSelectors.indexedThesaurus(state),
        relationships,
        { excludePreview: true }
      );
    });

    describe('when passing sortProperty', () => {
      it('should use formater.prepareMetadataForCard', () => {
        spyOn(formater, 'prepareMetadataForCard').and.returnValue({ metadata: 'metadataFormated' });
        const state = {
          templates,
          thesauris,
          settings: Immutable.fromJS({ languages: [{ key: 'es', default: true }] }),
        };
        const metadata = metadataSelectors.formatMetadata(
          state,
          doc,
          'sortProperty',
          relationships
        );
        expect(metadata).toBe('metadataFormated');
        expect(formater.prepareMetadataForCard).toHaveBeenCalledWith(
          doc,
          templates,
          metadataSelectors.indexedThesaurus(state),
          'sortProperty'
        );
      });
    });
  });
});
