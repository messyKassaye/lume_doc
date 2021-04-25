/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, MetadataSchema } from 'shared/types/commonTypes';

import { FileType } from 'shared/types/fileType';

export interface EntitySchema {
  _id?: ObjectIdSchema;
  sharedId?: string;
  language?: string;
  mongoLanguage?: string;
  title?: string;
  template?: ObjectIdSchema;
  published?: boolean;
  generatedToc?: boolean;
  icon?: {
    _id?: string | null;
    label?: string;
    type?: string;
  };
  creationDate?: number;
  user?: ObjectIdSchema;
  metadata?: MetadataSchema;
  suggestedMetadata?: MetadataSchema;
  [k: string]: unknown | undefined;
}

export type EntityWithFilesSchema = {
  _id?: ObjectIdSchema;
  sharedId?: string;
  language?: string;
  mongoLanguage?: string;
  title?: string;
  template?: ObjectIdSchema;
  published?: boolean;
  icon?: {
    _id?: string | null;
    label?: string;
    type?: string;
  };
  creationDate?: number;
  user?: ObjectIdSchema;
  metadata?: MetadataSchema;
  suggestedMetadata?: MetadataSchema;
  [k: string]: unknown | undefined;
} & {
  attachments?: FileType[];
  documents?: FileType[];
  [k: string]: unknown | undefined;
};
