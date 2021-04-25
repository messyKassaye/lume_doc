import { actions as formActions } from 'react-redux-form';
import { RequestParams } from 'app/utils/RequestParams';

import * as types from 'app/Templates/actions/actionTypes';
import { notificationActions } from 'app/Notifications';
import api from 'app/Templates/TemplatesAPI';
import ID from 'shared/uniqueID';
import { actions } from 'app/BasicReducer';

export function resetTemplate() {
  return dispatch => {
    dispatch(formActions.reset('template.data'));
    dispatch(formActions.setInitial('template.data'));
  };
}

export function setPropertyDefaults(getState, property) {
  const propertyWithDefaults = property;
  propertyWithDefaults.localID = ID();
  if (property.type === 'select' || property.type === 'multiselect') {
    propertyWithDefaults.content = getState()
      .thesauris.get(0)
      .get('_id');
  }

  if (property.type === 'relationship') {
    propertyWithDefaults.inherit = false;
    propertyWithDefaults.content = '';
  }

  if (property.type === 'nested') {
    propertyWithDefaults.nestedProperties = [{ key: '', label: '' }];
  }
  return propertyWithDefaults;
}

export function addProperty(property = {}, _index) {
  return (dispatch, getState) => {
    const properties = getState().template.data.properties.slice(0);
    const index = _index !== undefined ? _index : properties.length;
    const propertyWithDefaults = setPropertyDefaults(getState, property);
    properties.splice(index, 0, propertyWithDefaults);
    dispatch(formActions.change('template.data.properties', properties));
  };
}

export function setNestedProperties(propertyIndex, properties) {
  return dispatch => {
    dispatch(
      formActions.load(`template.data.properties[${propertyIndex}].nestedProperties`, properties)
    );
  };
}

export function updateProperty(property, index) {
  return (dispatch, getState) => {
    const properties = getState().template.data.properties.slice(0);
    properties.splice(index, 1, property);
    dispatch(formActions.change('template.data.properties', properties));
  };
}

export function inserted(index) {
  return dispatch => {
    dispatch(formActions.change(`template.data.properties[${index}].inserting`, null));
  };
}

export function selectProperty(index) {
  return {
    type: types.SELECT_PROPERTY,
    index,
  };
}

export function removeProperty(index) {
  return dispatch => {
    dispatch(formActions.remove('template.data.properties', index));
    dispatch(formActions.resetErrors('template.data'));
  };
}

export function reorderProperty(originIndex, targetIndex) {
  return dispatch => {
    dispatch(formActions.move('template.data.properties', originIndex, targetIndex));
  };
}

export const sanitize = data => {
  const properties = data.properties.map(_prop => {
    const prop = { ..._prop };
    if (prop.inherit && !prop.content) {
      prop.inherit = false;
    }
    delete prop.inserting;
    return prop;
  });
  return { ...data, properties };
};

export function validateMapping(template) {
  return api.validateMapping(new RequestParams(template));
}

export function saveTemplate(data) {
  const template = sanitize(data);
  return dispatch => {
    dispatch({ type: types.SAVING_TEMPLATE });
    return api
      .save(new RequestParams(template))
      .then(response => {
        dispatch({ type: types.TEMPLATE_SAVED, data: response });
        dispatch(actions.update('templates', response));

        dispatch(formActions.merge('template.data', response));
        dispatch(notificationActions.notify('Saved successfully.', 'success'));
      })
      .catch(() => {
        dispatch({ type: types.TEMPLATE_SAVED, data });
      });
  };
}
