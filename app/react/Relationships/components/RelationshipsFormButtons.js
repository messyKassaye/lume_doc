// TEST!!!
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import ShowIf from 'app/App/ShowIf';
import { NeedAuthorization } from 'app/Auth';
import { t } from 'app/I18N';
import { Icon } from 'UI';

import * as actions from '../actions/actions';

export class RelationshipsFormButtons extends Component {
  constructor(props) {
    super(props);
    this.edit = this.edit.bind(this);
  }

  edit(value) {
    return () => {
      this.props.edit(value, this.props.searchResults, this.props.parentEntity);
    };
  }

  render() {
    const { editing, saving } = this.props;

    return (
      <span>
        <NeedAuthorization roles={['admin', 'editor']}>
          <ShowIf if={!editing}>
            <button onClick={this.edit(true)} className="edit-metadata btn btn-primary">
              <Icon icon="pencil-alt" />
              <span className="btn-label">{t('System', 'Edit')}</span>
            </button>
          </ShowIf>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin', 'editor']}>
          <ShowIf if={editing}>
            <button onClick={this.edit(false)} className="cancel-edit-metadata btn btn-primary">
              <Icon icon="times" />
              <span className="btn-label">{t('System', 'Cancel')}</span>
            </button>
          </ShowIf>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin', 'editor']}>
          <ShowIf if={editing}>
            <button onClick={this.props.save} className="btn btn-success" disabled={saving}>
              <Icon icon={!saving ? 'save' : 'spinner'} pulse={!!saving} fixedWidth />
              <span className="btn-label">{t('System', 'Save')}</span>
            </button>
          </ShowIf>
        </NeedAuthorization>
      </span>
    );
  }
}

RelationshipsFormButtons.propTypes = {
  editing: PropTypes.bool,
  saving: PropTypes.bool,
  edit: PropTypes.func,
  save: PropTypes.func,
  parentEntity: PropTypes.object,
  searchResults: PropTypes.object,
};

const mapStateToProps = ({ relationships }) => ({
  editing: relationships.hubActions.get('editing'),
  saving: relationships.hubActions.get('saving'),
  parentEntity: relationships.list.entity,
  searchResults: relationships.list.searchResults,
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      edit: actions.edit,
      save: actions.saveRelationships,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipsFormButtons);
