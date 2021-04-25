import { actions } from 'app/BasicReducer';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import api from 'app/Search/SearchAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import rison from 'rison-node';
import { getThesaurusPropertyNames } from 'shared/commonTopicClassification';
import { setTableViewColumns } from 'app/Library/actions/libraryActions';
import { tocGenerationUtils } from 'app/ToggledFeatures/tocGeneration';
import { wrapDispatch } from 'app/Multireducer';
import { getTableColumns } from './tableColumns';
import setReduxState from './setReduxState.js';

export function decodeQuery(params) {
  try {
    return rison.decode(params.q || '()');
  } catch (error) {
    error.status = 404;
    throw error;
  }
}

export function processQuery(params, globalResources, key) {
  const defaultSearch = prioritySortingCriteria.get({ templates: globalResources.templates });

  let query = decodeQuery(params);

  query = Object.assign(query, {
    order: query.order || defaultSearch.order,
    sort: query.sort || defaultSearch.sort,
    view: params.view,
  });

  const noDocuments = !globalResources[key] || !globalResources[key].documents.get('rows').size;

  if (noDocuments && query.limit) {
    query = Object.assign(query, { limit: query.limit + (query.from || 0), from: 0 });
  }

  const { userSelectedSorting, ...sanitizedQuery } = query;
  return tocGenerationUtils.aggregations(
    sanitizedQuery,
    globalResources.settings.collection.toJS()
  );
}

export default function requestState(request, globalResources, calculateTableColumns = false) {
  const docsQuery = processQuery(request.data, globalResources, 'library');
  const documentsRequest = request.set(
    tocGenerationUtils.aggregations(docsQuery, globalResources.settings.collection.toJS())
  );
  const markersRequest = request.set({ ...docsQuery, geolocation: true });

  return Promise.all([api.search(documentsRequest), api.search(markersRequest)]).then(
    ([documents, markers]) => {
      const templates = globalResources.templates.toJS();
      const filterState = libraryHelpers.URLQueryToState(
        documentsRequest.data,
        templates,
        globalResources.thesauris.toJS(),
        globalResources.relationTypes.toJS(),
        request.data.quickLabelThesaurus
          ? getThesaurusPropertyNames(request.data.quickLabelThesaurus, templates)
          : []
      );

      const state = {
        library: {
          filters: {
            documentTypes: documentsRequest.data.types || [],
            properties: filterState.properties,
          },
          aggregations: documents.aggregations,
          search: filterState.search,
          documents,
          markers,
        },
      };

      const addinsteadOfSet = Boolean(docsQuery.from);

      const dispatchedActions = [
        setReduxState(state, 'library', addinsteadOfSet),
        actions.set('library.sidepanel.quickLabelState', {
          thesaurus: request.data.quickLabelThesaurus,
          autoSave: false,
        }),
      ];
      if (calculateTableColumns) {
        const tableViewColumns = getTableColumns(documents, templates, documentsRequest.data.types);
        dispatchedActions.push(dispatch =>
          wrapDispatch(dispatch, 'library')(setTableViewColumns(tableViewColumns))
        );
      }
      return dispatchedActions;
    }
  );
}
