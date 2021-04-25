function validateName(templates, id) {
  return {
    required: val => val && val.trim() !== '',
    duplicated: val =>
      !templates.find(
        template =>
          template._id !== id && template.name.trim().toLowerCase() === val.trim().toLowerCase()
      ),
  };
}

export function validateDuplicatedLabel(property, { properties, commonProperties }) {
  const titleProperty = commonProperties.find(p => p.name === 'title');
  const allProperties = titleProperty ? [titleProperty, ...properties] : properties || [];
  return allProperties.reduce((validity, prop) => {
    const sameProperty = (prop._id || prop.localID) === (property._id || property.localID);
    const differentLabel = prop.label.trim().toLowerCase() !== property.label.trim().toLowerCase();

    return validity && (sameProperty || differentLabel);
  }, true);
}

export function validateDuplicatedRelationship(property, properties) {
  return (properties || []).reduce((validity, prop) => {
    const sameProperty = (prop._id || prop.localID) === (property._id || property.localID);
    const differentRelationtype = !prop.relationType || prop.relationType !== property.relationType;
    const differentContent = prop.content !== property.content;
    const isNotAnyTemplate = Boolean(property.content && property.content.trim() !== '');
    return (
      validity && (sameProperty || differentRelationtype || (differentContent && isNotAnyTemplate))
    );
  }, true);
}

export function validateRequiredInheritproperty(prop) {
  return !prop || !prop.inherit || Boolean(prop.inheritProperty);
}

function getLabelRequiredValidator(propertiesArrayKey, propIndex) {
  return template => {
    if (!template[propertiesArrayKey][propIndex]) {
      return true;
    }
    const { label } = template[propertiesArrayKey][propIndex];
    return label && label.trim() !== '';
  };
}

function getLabelDuplicatedValidator(propertiesArrayKey, propIndex) {
  return template => {
    if (!template[propertiesArrayKey][propIndex]) {
      return true;
    }
    const prop = template[propertiesArrayKey][propIndex];
    return validateDuplicatedLabel(prop, template);
  };
}

export default function(properties, commonProperties, templates, id) {
  const validator = {
    '': {},
    name: validateName(templates, id),
  };

  const titleIndex = commonProperties.findIndex(p => p.name === 'title');
  if (titleIndex >= 0) {
    validator[''][`commonProperties.${titleIndex}.label.required`] = getLabelRequiredValidator(
      'commonProperties',
      titleIndex
    );
    validator[''][`commonProperties.${titleIndex}.label.duplicated`] = getLabelDuplicatedValidator(
      'commonProperties',
      titleIndex
    );
  }

  properties.forEach((_property, index) => {
    validator[''][`properties.${index}.label.required`] = getLabelRequiredValidator(
      'properties',
      index
    );
    validator[''][`properties.${index}.label.duplicated`] = getLabelDuplicatedValidator(
      'properties',
      index
    );

    validator[''][`properties.${index}.content.required`] = template => {
      if (
        !template.properties[index] ||
        template.properties[index].type !== 'select' ||
        template.properties[index].type !== 'multiselect'
      ) {
        return true;
      }
      const { content } = template.properties[index];
      return content && content.trim() !== '';
    };

    validator[''][`properties.${index}.relationType.required`] = template => {
      if (!template.properties[index] || template.properties[index].type !== 'relationship') {
        return true;
      }
      const { relationType } = template.properties[index];
      return relationType && relationType.trim() !== '';
    };

    validator[''][`properties.${index}.relationType.duplicated`] = template => {
      if (!template.properties[index] || template.properties[index].type !== 'relationship') {
        return true;
      }
      const prop = template.properties[index];
      return validateDuplicatedRelationship(prop, template.properties);
    };

    validator[''][`properties.${index}.inheritProperty.required`] = template => {
      const prop = template.properties[index];
      return validateRequiredInheritproperty(prop);
    };
  });

  return validator;
}
