import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';

const templateId = db.id();
const relatedTo = db.id();
const templateToBeInherited = db.id();
const propertyToBeInherited = db.id();

export default {
  templates: [
    {
      _id: templateId,
      name: 'DuplicateName',
      properties: [],
    },
    {
      _id: templateToBeInherited,
      name: 'template to be inherited',
      commonProperties: [{ name: 'title', label: 'Title', type: propertyTypes.text }],
      properties: [{ _id: propertyToBeInherited, name: 'inherit_me', type: propertyTypes.text }],
      default: true,
    },
    {
      name: 'template inheriting from another',
      commonProperties: [{ name: 'title', label: 'Title', type: propertyTypes.text }],
      properties: [
        {
          id: '1',
          type: propertyTypes.relationship,
          name: 'inherit',
          label: 'Inherit',
          relationtype: relatedTo,
          content: templateToBeInherited,
          inherit: true,
          inheritProperty: propertyToBeInherited,
        },
      ],
    },
    {
      _id: db.id(),
      name: 'template with shared properties',
      properties: [
        {
          type: propertyTypes.select,
          name: 'sharedproperty1',
          label: 'sharedProperty1',
          content: 'thesauriId1',
        },
        {
          type: propertyTypes.select,
          name: 'sharedproperty2',
          label: 'sharedProperty2',
          content: 'thesauriId2',
        },
        {
          type: propertyTypes.numeric,
          name: 'sharedproperty3',
          label: 'sharedProperty3',
        },
        {
          type: propertyTypes.relationship,
          content: 'template1',
          relationtype: 'relationType1',
          name: 'sharedrelationship1',
          label: 'sharedRelationship1',
        },
        {
          name: 'validproperty4',
          label: 'validProperty4',
          type: propertyTypes.multiselect,
          content: 'thesauriId4',
        },
        {
          name: 'validpropertydate',
          label: 'validPropertyDate',
          type: propertyTypes.multidate,
        },
        {
          name: 'validpropertydaterange',
          label: 'validPropertyDateRange',
          type: propertyTypes.multidaterange,
        },
        {
          name: 'validpropertyrichtext',
          label: 'validPropertyRichText',
          type: propertyTypes.text,
        },
        {
          name: 'validpropertymultiselect',
          label: 'validPropertyMultiSelect',
          type: propertyTypes.select,
          content: 'thesauriId4',
        },
        {
          name: 'validpropertymultidate',
          label: 'validPropertyMultiDate',
          type: propertyTypes.date,
        },
        {
          name: 'validpropertymultidaterange',
          label: 'validPropertyMultiDateRange',
          type: propertyTypes.daterange,
        },
      ],
      commonProperties: [{ name: 'title', label: 'Title' }],
    },
  ],
  relationtypes: [{ _id: relatedTo, name: 'related to' }],
};

export { templateId, templateToBeInherited, propertyToBeInherited };
