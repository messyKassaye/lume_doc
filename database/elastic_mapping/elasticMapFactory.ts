import { TemplateSchema } from 'shared/types/templateType';
import { propertyMappings } from './mappings';

export default {
  mapping: (templates: TemplateSchema[]) => {
    const baseMappingObject = {
      properties: {
        metadata: {
          properties: {},
        },
        suggestedMetadata: {
          properties: {},
        },
      },
    };

    return templates.reduce(
      (baseMapping: any, template: TemplateSchema) =>
        template.properties?.reduce((_map: any, property) => {
          const map = { ..._map };
          if (!property.name || !property.type || property.type === 'preview') {
            return map;
          }

          const fieldMapping = propertyMappings[property.type]();
          map.properties.metadata.properties[property.name] = { properties: fieldMapping };
          map.properties.suggestedMetadata.properties[property.name] = { properties: fieldMapping };
          return map;
        }, baseMapping),
      baseMappingObject
    );
  },
};
