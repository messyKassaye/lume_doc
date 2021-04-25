import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fromJS as Immutable } from 'immutable';

import SearchBar from 'app/ConnectionsList/components/SearchBar';
import RelationshipsGraph from 'app/Relationships/components/RelationshipsGraphEdit';
import LoadMoreRelationshipsButton from 'app/Relationships/components/LoadMoreRelationshipsButton';
import DocumentsList from 'app/Layout/DocumentsList';
import { searchReferences } from '../actions/actions';

export function mapStateToProps({ relationships }) {
  const documents = relationships.list.searchResults;

  return {
    documents,
    connections: {
      totalRows: (documents.get('rows') || Immutable([]))
        .filter(r => r.get('sharedId') !== relationships.list.sharedId)
        .reduce((total, r) => total + r.get('connections').size, 0),
    },
    filters: Immutable({ documentTypes: [] }),
    search: relationships.list.sort,
    sortButtonsStateProperty: 'relationships/list.sort',
    SearchBar,
    GraphView: RelationshipsGraph,
    view: 'graph',
    LoadMoreButton: LoadMoreRelationshipsButton,
    connectionsGroups: relationships.list.connectionsGroups,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      searchDocuments: searchReferences,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
