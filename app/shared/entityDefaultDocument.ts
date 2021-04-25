import { FileType } from 'shared/types/fileType';
import language from 'shared/languagesList';

export const entityDefaultDocument = (
  documents: Array<FileType> = [],
  entityLanguage: string,
  defaultLanguage: string
) => {
  const documentMatchingEntity = documents.find(
    (document: FileType) =>
      document.language && language(document.language, 'ISO639_1') === entityLanguage
  );

  const documentMatchingDefault = documents.find(
    (document: FileType) =>
      document.language && language(document.language, 'ISO639_1') === defaultLanguage
  );

  return documentMatchingEntity || documentMatchingDefault || documents[0];
};
