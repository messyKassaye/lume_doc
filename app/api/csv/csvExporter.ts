import { Writable } from 'stream';
import { EventEmitter } from 'events';
import * as csv from '@fast-csv/format';
import templates from 'api/templates';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import translate, { getLocaleTranslation, getContext } from 'shared/translate';
import translations from 'api/i18n/translations';
import {
  formatters,
  formatCreationDate,
  formatDocuments,
  formatAttachments,
} from './typeFormatters';
import { EntitySchema } from '../../shared/types/entityType';

export type SearchResults = {
  rows: any[];
  totalRows: number;
  aggregations: {
    all: {
      _types?: {
        buckets: {
          key: string;
          // eslint-disable-next-line camelcase
          doc_count: number;
          // eslint-disable-next-line camelcase
          filtered: { doc_count: number };
        }[];
      };
    };
  };
};

export type ExporterOptions = {
  dateFormat: string;
  language: string;
};

export type ExportHeader = {
  label: string;
  name: string;
  common: boolean;
};

type TemplatesCache = {
  [id: string]: TemplateSchema;
};

export const getTypes = (searchResults: SearchResults, typesWhitelist: string[] = []) =>
  typesWhitelist.length
    ? typesWhitelist
    : searchResults.aggregations.all
        ._types!.buckets.filter(bucket => bucket.filtered.doc_count > 0)
        .map(bucket => bucket.key);

const hasValue = (value: string) => value !== 'missing';

export const getTemplatesModels = async (templateIds: string[]): Promise<TemplatesCache> =>
  Promise.all(
    templateIds.filter(hasValue).map(async (id: string) => templates.getById(id))
  ).then(results =>
    results.reduce<any>(
      (memo, template) => (template ? { ...memo, [template._id]: template } : memo),
      {}
    )
  );

const notDuplicated = (collection: any) => (item: any) =>
  collection.findIndex((i: any) => Object.keys(i).every(key => i[key] === item[key])) < 0;

const excludedProperties = (property: PropertySchema) =>
  !['geolocation', 'preview', 'nested'].includes(property.type);

export const processHeaders = (templatesCache: TemplatesCache): ExportHeader[] =>
  Object.values(templatesCache).reduce(
    (memo: any[], template: any) =>
      memo.concat(
        template.properties
          .filter(excludedProperties)
          .map((property: any) => ({ label: property.label, name: property.name }))
          .filter(notDuplicated(memo))
      ),
    []
  );

export const prependCommonHeaders = (headers: ExportHeader[]) =>
  [
    {
      label: 'Title',
      name: 'title',
      common: true,
    },
    {
      label: 'Date added',
      name: 'creationDate',
      common: true,
    },
    {
      label: 'Template',
      name: 'template',
      common: true,
    },
  ].concat(headers);

export const concatCommonHeaders = (headers: ExportHeader[]) =>
  headers.concat([
    { label: 'Geolocation', name: 'geolocation', common: true },
    { label: 'Documents', name: 'documents', common: true },
    { label: 'Attachments', name: 'attachments', common: true },
    { label: 'Published', name: 'published', common: true },
  ]);

export const processGeolocationField = (row: any, rowTemplate: TemplateSchema) => {
  const geolocationField: PropertySchema | undefined = rowTemplate.properties?.find(
    property => property.type === 'geolocation'
  );

  if (geolocationField && geolocationField.name && row.metadata[geolocationField.name]) {
    return formatters.geolocation(row.metadata[geolocationField.name], {});
  }

  return '';
};

export const processCommonField = (
  headerName: string,
  row: any,
  rowTemplate: TemplateSchema,
  options: any
) => {
  switch (headerName) {
    case 'title':
      return row.title;
    case 'template':
      return rowTemplate.name;
    case 'creationDate':
      return formatCreationDate(row, options);
    case 'geolocation':
      return processGeolocationField(row, rowTemplate);
    case 'documents':
      return formatDocuments(row);
    case 'attachments':
      return formatAttachments(row);
    case 'published':
      return row.published ? 'Published' : 'Unpublished';
    default:
      return '';
  }
};

export const translateCommonHeaders = async (headers: ExportHeader[], language: string) => {
  const _translations = await translations.get();
  const locale = getLocaleTranslation(_translations, language);
  const context = getContext(locale, 'System');
  return headers.map(header => {
    if (!header.common) {
      return header;
    }

    return { ...header, label: translate(context, header.label, header.label) };
  });
};

export const processEntity = (
  row: EntitySchema,
  headers: ExportHeader[],
  templatesCache: TemplatesCache,
  options: ExporterOptions
) => {
  if (!row.template) {
    throw new Error('Entity missing template');
  }

  const rowTemplate: TemplateSchema = templatesCache[row.template.toString()];

  if (!rowTemplate) {
    throw new Error('Entity missing template');
  }

  return headers.map((header: ExportHeader) => {
    if (header.common) {
      return processCommonField(header.name, row, rowTemplate, options);
    }

    if (!row.metadata?.[header.name]) {
      return '';
    }

    const templateProperty = rowTemplate?.properties?.find(
      (property: PropertySchema) => property.name === header.name
    );

    if (!templateProperty || !excludedProperties(templateProperty)) {
      return '';
    }

    return formatters[templateProperty.type](row.metadata[header.name] || [], options);
  });
};

export default class CSVExporter extends EventEmitter {
  async export(
    searchResults: SearchResults,
    types: string[] = [],
    writeStream: Writable,
    options: ExporterOptions = { dateFormat: 'YYYY-MM-DD', language: 'en' }
  ): Promise<void> {
    const csvStream = csv.format({ headers: false });

    csvStream.pipe<any>(writeStream).on('finish', writeStream.end);

    const templatesCache = await getTemplatesModels(getTypes(searchResults, types));
    let headers = prependCommonHeaders(concatCommonHeaders(processHeaders(templatesCache)));
    headers = await translateCommonHeaders(headers, options.language);

    return new Promise(resolve => {
      csvStream.write(headers.map((h: any) => h.label));

      searchResults.rows.forEach(row => {
        csvStream.write(processEntity(row, headers, templatesCache, options));
        this.emit('entityProcessed');
      });

      csvStream.end();
      writeStream.on('finish', resolve);
    });
  }
}
