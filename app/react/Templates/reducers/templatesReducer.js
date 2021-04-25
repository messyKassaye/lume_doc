import Immutable from 'immutable';

import * as types from 'app/Templates/actions/actionTypes';

const initialState = [];

export default function templates(state = initialState, action = {}) {
  if (action.type === types.SET_TEMPLATES) {
    return Immutable.fromJS(action.templates);
  }

  if (action.type === types.DELETE_TEMPLATE) {
    return state.filter(template => template.get('_id') !== action.id);
  }

  return Immutable.fromJS(state);
}
