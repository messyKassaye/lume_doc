import * as helpers from 'api/activitylog/helpers';
import { nameFunc } from 'api/activitylog/helpers';
import { buildActivityEntry, Methods, EntryValue } from 'api/activitylog/activityLogBuilder';

const entryValues: { [key: string]: EntryValue } = {
  'POST/api/users': {
    desc: 'Updated user',
    method: Methods.Update,
    idField: '_id',
    nameField: 'username',
  },
  'POST/api/entities/multipleupdate': { desc: 'Updated multiple entities' },
  'POST/api/entities/bulkdelete': { desc: 'Deleted multiple entities', method: Methods.Delete },
  'POST/api/attachments/upload': {
    desc: 'Uploaded attachment',
    method: Methods.Create,
    related: helpers.loadEntity,
    nameField: 'title',
  },
  'POST/api/settings': { desc: 'Updated settings' },
  'POST/api/relationships/bulk': { desc: 'Updated relationships' },
  'POST/api/upload': { desc: 'Uploaded document', method: Methods.Create },
  'POST/api/reupload': { desc: 'Re-uploaded document' },
  'POST/api/customisation/upload': { desc: 'Uploaded custom file', method: Methods.Create },
  'POST/api/import': { desc: 'Imported entities from file', method: Methods.Create },
  'POST/api/public': {
    desc: 'Created entity coming from a public form',
    method: Methods.Create,
    nameField: 'title',
    related: helpers.loadEntityFromPublicForm,
    extra: helpers.extraTemplate,
  },
  'POST/api/remotepublic': {
    desc: 'Submitted entity to a remote instance',
    method: Methods.Create,
  },
  'POST/api/references': { desc: 'Created relationship', method: Methods.Create, idField: '_id' },
  'POST/api/pages': {
    desc: 'Created page',
    method: Methods.Create,
    idField: 'sharedId',
    nameField: 'title',
  },
  'POST/api/templates': {
    desc: 'Created template',
    method: Methods.Create,
    idField: '_id',
    nameField: 'name',
  },
  'POST/api/thesauris': {
    desc: 'Created thesaurus',
    method: Methods.Create,
    idField: '_id',
    nameField: 'name',
  },
  'POST/api/relationtypes': {
    desc: 'Created relation type',
    method: Methods.Create,
    idField: '_id',
    nameField: 'name',
  },
  'POST/api/entities': {
    desc: 'Created entity / document',
    method: Methods.Create,
    idField: 'sharedId',
    nameField: 'title',
    related: helpers.loadTemplate,
    extra: helpers.extraTemplate,
  },
  'POST/api/documents': {
    desc: 'Created entity / document',
    method: Methods.Create,
    idField: 'sharedId',
    nameField: 'title',
    related: helpers.loadTemplate,
    extra: helpers.extraTemplate,
  },
  'DELETE/api/entities': {
    desc: 'Deleted entity / document',
    method: Methods.Delete,
    nameField: 'sharedId',
  },
  'DELETE/api/documents': {
    desc: 'Deleted entity / document',
    method: Methods.Delete,
    nameField: 'sharedId',
  },
  'POST/api/attachments/rename': {
    desc: 'Renamed attachment',
    idField: '_id',
    nameFunc: data => `${data.originalname} (${data._id})`,
    related: helpers.loadEntity,
    extra: helpers.extraAttachmentLanguage,
  },
  'DELETE/api/attachments/delete': {
    desc: 'Deleted attachment',
    method: Methods.Delete,
    nameField: 'attachmentId',
  },
  'POST/api/templates/setasdefault': {
    desc: 'Set default template',
    related: helpers.loadTemplate,
    nameFunc: helpers.templateName,
  },
  'DELETE/api/templates': { desc: 'Deleted template', method: Methods.Delete, nameField: '_id' },
  'DELETE/api/thesauris': { desc: 'Deleted thesaurus', method: Methods.Delete, nameField: '_id' },
  'DELETE/api/relationtypes': {
    desc: 'Deleted relation type',
    method: Methods.Delete,
    nameField: '_id',
  },
  'POST/api/translations': {
    desc: 'Updated translations',
    nameFunc: helpers.translationsName,
    extra: data => `in ${helpers.formatLanguage(data.locale)}`,
  },
  'POST/api/translations/languages': { desc: 'Added language', method: Methods.Create, nameFunc },
  'DELETE/api/translations/languages': {
    desc: 'Removed language',
    method: Methods.Delete,
    nameFunc: helpers.formatDataLanguage,
  },
  'POST/api/translations/setasdeafult': {
    desc: 'Set default language',
    nameFunc: helpers.formatDataLanguage,
  },
  'DELETE/api/pages': { desc: 'Deleted page', method: Methods.Delete, nameField: 'sharedId' },
  'DELETE/api/references': {
    desc: 'Deleted relationship',
    method: Methods.Delete,
    nameField: '_id',
  },
  'DELETE/api/customisation/upload': {
    desc: 'Deleted custom file',
    method: Methods.Delete,
    nameField: '_id',
  },
  'POST/api/users/new': {
    desc: 'Added new user',
    method: Methods.Create,
    nameField: 'username',
    extra: data => `with ${data.role} role`,
  },
  'POST/api/files/upload/document': {
    desc: 'Uploaded file',
    method: Methods.Create,
    related: helpers.loadEntity,
    nameField: 'title',
  },
  'DELETE/api/files': { desc: 'Delete file', method: Methods.Delete, nameField: '_id' },
  'POST/api/files': {
    desc: 'Updated file',
    related: helpers.loadFile,
    nameFunc: helpers.updatedFile,
  },
  'DELETE/api/users': { desc: 'Delete user', method: Methods.Delete, nameField: '_id' },
  'POST/api/usergroups': {
    desc: 'Created user group',
    method: Methods.Create,
    idField: '_id',
    nameField: 'name',
    extra: helpers.groupMembers,
  },
  'DELETE/api/usergroups': {
    desc: 'Delete user group',
    method: Methods.Delete,
    nameField: '_id',
  },
};

const getSemanticData = async (data: any) => {
  const action = `${data.method}${data.url}`;
  if (action === 'MIGRATE') {
    return helpers.migrationLog(data);
  }
  const entryValue = entryValues[action] || {
    desc: '',
    extra: () => `${data.method}: ${data.url}`,
    method: 'RAW',
  };
  const activityEntry = await buildActivityEntry(entryValue, data);
  return { ...activityEntry };
};

export { getSemanticData };
