import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import ShowIf from 'app/App/ShowIf';
import { t } from 'app/I18N';
import { Icon } from 'UI';

import { resetSearch } from '../actions/actions';

export class ResetSearch extends Component {
  render() {
    const { connectionsGroups } = this.props;
    return (
      <ShowIf if={Boolean(connectionsGroups.size)}>
        <button onClick={this.props.resetSearch} className="btn btn-primary">
          <Icon icon="sync" />
          <span className="btn-label">{t('System', 'Reset')}</span>
        </button>
      </ShowIf>
    );
  }
}

ResetSearch.propTypes = {
  connectionsGroups: PropTypes.object,
  resetSearch: PropTypes.func,
};

function mapStateToProps({ relationships }) {
  return {
    connectionsGroups: relationships.list.connectionsGroups,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resetSearch }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ResetSearch);
