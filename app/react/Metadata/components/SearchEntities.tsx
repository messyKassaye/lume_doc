import React, { Component } from 'react';

import SearchResults from 'app/Connections/components/SearchResults';
import { EntitySchema } from 'shared/types/entityType';
import SearchInput from 'app/Layout/SearchInput';
import debounce from 'app/utils/debounce';
import { RequestParams } from 'app/utils/RequestParams';
import { IImmutable } from 'shared/types/Immutable';
import Immutable from 'immutable';
import api from 'app/utils/api';

export type SearchEntitiesProps = {
  onSelect: Function;
  onFinishSearch: Function;
  initialSearchTerm?: string;
};

export type SearchEntitiesState = {
  searchResults: IImmutable<Array<EntitySchema>>;
  searching: boolean;
  touched: boolean;
};

export class SearchEntities extends Component<SearchEntitiesProps, SearchEntitiesState> {
  constructor(props: SearchEntitiesProps) {
    super(props);
    this.state = { searchResults: Immutable.fromJS([]), searching: false, touched: false };
    this.onSelect = this.onSelect.bind(this);
    this.onChange = this.onChange.bind(this);
    this.search = this.search.bind(this);
  }

  componentDidMount() {
    if (this.props.initialSearchTerm) {
      this.search(this.props.initialSearchTerm);
    }
  }

  onSelect(_sharedId: string, entity: EntitySchema) {
    this.props.onSelect(entity);
  }

  search(searchTerm: string) {
    this.setState({ searching: true });
    const requestParams = new RequestParams({
      searchTerm,
      fields: ['title'],
      includeUnpublished: true,
    });

    interface ApiResponse {
      json: { rows: [EntitySchema] };
    }

    return api.get('search', requestParams).then((response: ApiResponse) => {
      const searchResults = response.json.rows;
      this.setState({
        searchResults: Immutable.fromJS(searchResults),
        searching: false,
      });
      this.props.onFinishSearch(searchTerm);
    });
  }

  onChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ touched: true });
    const searchTerm = e.target.value;
    return debounce(this.search, 400)(searchTerm);
  }

  render() {
    const { searchResults, searching } = this.state;
    return (
      <>
        <div className="search-box">
          <SearchInput
            onChange={this.onChange}
            value={!this.state.touched ? this.props.initialSearchTerm : undefined}
          />
        </div>
        <SearchResults results={searchResults} searching={searching} onClick={this.onSelect} />
      </>
    );
  }
}
