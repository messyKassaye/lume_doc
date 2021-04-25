import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export const groupMemberSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    username: { type: 'string' },
    role: { type: 'string' },
    email: { type: 'string' },
  },
  required: ['_id'],
};
export const userGroupSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  additionalProperties: false,
  uniqueName: true,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    name: { type: 'string' },
    members: {
      type: 'array',
      items: {
        ...groupMemberSchema,
      },
    },
    __v: { type: 'number' },
  },
  required: ['name', 'members'],
};
