import { I18NLink, t } from 'app/I18N';
import { checkThesaurusCanBeDeleted, deleteThesaurus } from 'app/Thesauri/actions/thesaurisActions';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'UI';
import sortThesauri from '../utils/sortThesauri';

export class ThesauriList extends Component {
  getThesaurusSuggestionActions(thesaurus) {
    const showSuggestions =
      this.props.topicClassificationEnabled || thesaurus.enable_classification;
    return (
      showSuggestions && (
        <div className="vertical-line">
          {thesaurus.enable_classification && (
            <span className="thesaurus-suggestion-count">
              {thesaurus.suggestions ? thesaurus.suggestions.toLocaleString() : 'No'}&nbsp;
              {t('System', 'documents to be reviewed')}
            </span>
          )}
          <I18NLink
            to={`/settings/dictionaries/cockpit/${thesaurus._id}`}
            className="btn btn-default btn-xs"
          >
            <span>{t('System', 'Configure suggestions')}</span>
          </I18NLink>
        </div>
      )
    );
  }

  getThesaurusModifyActions(thesaurus) {
    return (
      <div>
        <I18NLink
          to={`/settings/dictionaries/edit/${thesaurus._id}`}
          className="btn btn-default btn-xs"
          confirmTitle={
            thesaurus.enable_classification ? 'Confirm edit suggestion-enabled Thesaurus' : ''
          }
          confirmMessage={
            thesaurus.enable_classification
              ? 'Uwazi suggests labels based on the current content of the document collection and its metadata. ' +
                'Editing this thesaurus, the content of the documents or other metadata can affect Uwazi’s understanding of what to suggest.'
              : ''
          }
        >
          <Icon icon="pencil-alt" />
          &nbsp;
          <span>{t('System', 'Edit')}</span>
        </I18NLink>
        {'  '}
        <button
          onClick={this.deleteThesaurus.bind(this, thesaurus)}
          className="btn btn-danger btn-xs template-remove"
          type="button"
        >
          <Icon icon="trash-alt" />
          &nbsp;
          <span>{t('System', 'Delete')}</span>
        </button>
      </div>
    );
  }

  deleteThesaurus(thesaurus) {
    return this.props
      .checkThesaurusCanBeDeleted(thesaurus)
      .then(() => {
        this.context.confirm({
          accept: () => {
            this.props.deleteThesaurus(thesaurus);
          },
          title: `Confirm delete thesaurus: ${thesaurus.name}`,
          message: 'Are you sure you want to delete this thesaurus?',
        });
      })
      .catch(() => {
        this.context.confirm({
          accept: () => {},
          noCancel: true,
          title: `Cannot delete thesaurus: ${thesaurus.name}`,
          message: 'This thesaurus is being used in document types and cannot be deleted.',
        });
      });
  }

  thesaurusNode(thesaurus) {
    return (
      <tr key={thesaurus.name}>
        <th scope="row">{thesaurus.name}</th>
        <td>{this.getThesaurusSuggestionActions(thesaurus)}</td>
        <td>{this.getThesaurusModifyActions(thesaurus)}</td>
      </tr>
    );
  }

  render() {
    return (
      <div className="flex panel panel-default">
        <div className="panel-heading">{t('System', 'Thesauri')}</div>
        <div className="thesauri-list">
          <table>
            <thead>
              <tr>
                <th className="nameCol" scope="col" />
                <th scope="col" />
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {sortThesauri(this.props.dictionaries.toJS()).map(thesaurus =>
                this.thesaurusNode(thesaurus)
              )}
            </tbody>
          </table>
        </div>
        <div className="settings-footer">
          <I18NLink to="/settings/dictionaries/new" className="btn btn-success">
            <Icon icon="plus" />
            <span className="btn-label">{t('System', 'Add thesaurus')}</span>
          </I18NLink>
        </div>
      </div>
    );
  }
}

ThesauriList.propTypes = {
  dictionaries: PropTypes.object,
  topicClassificationEnabled: PropTypes.bool,
  deleteThesaurus: PropTypes.func.isRequired,
  checkThesaurusCanBeDeleted: PropTypes.func.isRequired,
};

ThesauriList.contextTypes = {
  confirm: PropTypes.func,
};

export function mapStateToProps(state) {
  return {
    dictionaries: state.dictionaries,
    topicClassificationEnabled: (state.settings.collection.toJS().features || {})
      .topicClassification,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      deleteThesaurus,
      checkThesaurusCanBeDeleted,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(ThesauriList);
