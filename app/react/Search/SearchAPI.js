import api from 'app/utils/api';

export default {
  countByTemplate(requestParams) {
    const url = 'search/count_by_template';
    return api.get(url, requestParams).then(response => response.json);
  },

  searchSnippets(requestParams) {
    const url = 'search_snippets';
    return api.get(url, requestParams).then(response => response.json);
  },

  search(requestParams) {
    return api.get('search', requestParams).then(response => response.json);
  },

  list(requestParams) {
    const url = 'search/list';
    return api.get(url, requestParams).then(response => response.json.rows);
  },

  getSuggestions(requestParams) {
    const url = 'search/lookup';
    return api.get(url, requestParams).then(response => response.json);
  },

  getAggregationSuggestions(requestParams) {
    const url = 'search/lookupaggregation';
    return api.get(url, requestParams).then(response => response.json);
  },
};
