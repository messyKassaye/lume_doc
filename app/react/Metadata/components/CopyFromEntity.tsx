import React, { Component } from 'react';

import { EntitySchema } from 'shared/types/entityType';
import { SearchEntities } from './SearchEntities';
import { FormatMetadata } from '../containers/FormatMetadata';
import { TemplateSchema } from 'shared/types/templateType';
import { IImmutable } from 'shared/types/Immutable';
import comonProperties from 'shared/comonProperties';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { actions } from 'app/Metadata';
import { store } from 'app/store';

export type CopyFromEntityProps = {
  onSelect: Function;
  onCancel: Function;
  templates: IImmutable<Array<TemplateSchema>>;
  originalEntity: EntitySchema;
  formModel: string;
};

export type CopyFromEntityState = {
  selectedEntity: EntitySchema;
  propsToCopy: Array<string>;
  lastSearch?: string;
};

export class CopyFromEntity extends Component<CopyFromEntityProps, CopyFromEntityState> {
  constructor(props: CopyFromEntityProps) {
    super(props);

    this.state = { propsToCopy: [], selectedEntity: {}, lastSearch: undefined };
    this.onSelect = this.onSelect.bind(this);
    this.cancel = this.cancel.bind(this);
    this.copy = this.copy.bind(this);
    this.backToSearch = this.backToSearch.bind(this);
    this.onFinishedSearch = this.onFinishedSearch.bind(this);
  }

  onSelect(selectedEntity: EntitySchema) {
    const copyFromTemplateId = selectedEntity.template;
    const templates = this.props.templates.toJS();
    const originalTemplate = this.props.originalEntity.template;

    const propsToCopy = comonProperties
      .comonProperties(templates, [originalTemplate, copyFromTemplateId])
      .map(p => p.name);

    this.setState({ selectedEntity, propsToCopy });
    this.props.onSelect(propsToCopy, selectedEntity);
  }

  copy() {
    if (!this.state.selectedEntity.metadata) {
      return;
    }

    const updatedEntity = this.state.propsToCopy.reduce(
      (entity: EntitySchema, propName: string) => {
        if (!entity.metadata) {
          entity.metadata = {};
        }

        entity.metadata[propName] = this.state.selectedEntity.metadata![propName];
        return entity;
      },
      { ...this.props.originalEntity, metadata: { ...this.props.originalEntity.metadata } }
    );

    actions
      .loadFetchedInReduxForm(this.props.formModel, updatedEntity, this.props.templates.toJS())
      .forEach(action => store?.dispatch(action));

    this.props.onSelect([]);
    this.props.onCancel();
  }

  backToSearch() {
    this.setState({ propsToCopy: [], selectedEntity: {} });
    this.props.onSelect([]);
  }

  cancel() {
    this.props.onSelect([]);
    this.props.onCancel();
  }

  onFinishedSearch(searchTerm: string) {
    this.setState({ lastSearch: searchTerm });
  }

  renderPanel() {
    return this.state.selectedEntity._id ? (
      <>
        <div className="view">
          <FormatMetadata
            entity={this.state.selectedEntity}
            highlight={this.state.propsToCopy}
            excludePreview
          />
        </div>
        <div className="copy-from-buttons">
          <button className="back-copy-from btn btn-light" onClick={this.backToSearch}>
            <Icon icon="arrow-left" />
            <span className="btn-label">
              <Translate>Back to search</Translate>
            </span>
          </button>
          <button className="cancel-copy-from btn btn-primary" onClick={this.cancel}>
            <Icon icon="times" />
            <span className="btn-label">
              <Translate>Cancel</Translate>
            </span>
          </button>
          <button className="copy-copy-from btn btn-success" onClick={this.copy}>
            <Icon icon="copy-from" transform="left-0.075 up-0.1" />
            <span className="btn-label">
              <Translate>Copy Highlighted</Translate>
            </span>
          </button>
        </div>
      </>
    ) : (
      <>
        <SearchEntities
          onSelect={this.onSelect}
          onFinishSearch={this.onFinishedSearch}
          initialSearchTerm={this.state.lastSearch}
        />
        <div className="copy-from-buttons">
          <button className="cancel-copy-from btn btn-primary" onClick={this.cancel}>
            <Icon icon="times" />
            <span className="btn-label">
              <Translate>Cancel</Translate>
            </span>
          </button>
        </div>
      </>
    );
  }

  render() {
    return <div className="copy-from">{this.renderPanel()}</div>;
  }
}
