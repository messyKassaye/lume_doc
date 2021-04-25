import * as types from 'app/Library/actions/actionTypes';
import libraryHelper from 'app/Library/helpers/libraryFilters';
import comonPropertiesHelper from 'shared/comonProperties';
import * as libraryActions from 'app/Library/actions/libraryActions';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import { actions as formActions } from 'react-redux-form';

export function filterDocumentTypes(documentTypes, storeKey) {
  return (dispatch, getState) => {
    const state = getState();

    const templates = state.templates.toJS();
    const thesauris = state.thesauris.toJS();

    let libraryFilters = comonPropertiesHelper
      .comonProperties(templates, documentTypes)
      .filter(prop => prop.filter);
    libraryFilters = libraryHelper.populateOptions(libraryFilters, thesauris);

    const usefulTemplates = documentTypes.length
      ? templates.filter(t => documentTypes.includes(t._id))
      : templates;

    const { sort, order } = prioritySortingCriteria.get({
      currentCriteria: { sort: state[storeKey].search.sort, order: state[storeKey].search.order },
      filteredTemplates: usefulTemplates.map(t => t._id),
      templates: state.templates,
      selectedSorting: state[storeKey].selectedSorting,
    });

    const search = {
      types: documentTypes,
      ...state[storeKey].search,
      sort,
      order,
    };

    const filters = { documentTypes, properties: libraryFilters };
    dispatch(libraryActions.searchDocuments({ filters, search }, storeKey));
  };
}

export function resetFilters(storeKey) {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_LIBRARY_FILTERS, documentTypes: [], libraryFilters: [] });
    dispatch(
      formActions.load(`${storeKey}.search`, {
        searchTerm: '',
        filters: {},
        order: 'desc',
        sort: 'creationDate',
      })
    );
    libraryActions.searchDocuments({ search: getState()[storeKey].search }, storeKey)(
      dispatch,
      getState
    );
  };
}

export function toggleFilter(propertyName, properties) {
  return dispatch => {
    const updatedProperties = properties.map(property => {
      if (property.name === propertyName) {
        property.active = !property.active;
      }
      return property;
    });
    dispatch({ type: types.UPDATE_LIBRARY_FILTERS, libraryFilters: updatedProperties });
  };
}
