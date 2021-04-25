import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { actions } from 'app/Metadata';
import { MenuButtons } from 'app/ContextMenu';
import { NeedAuthorization } from 'app/Auth';
import { Icon } from 'UI';

export class MetadataPanelMenu extends Component {
  render() {
    if (this.props.targetDoc) {
      return false;
    }
    return (
      <div>
        {(() => {
          if (this.props.docForm && this.props.docForm._id) {
            let disabled = true;
            if (this.props.formState.dirty) {
              disabled = false;
            }

            return (
              <MenuButtons.Main disabled={disabled}>
                <button type="submit" form="metadataForm" disabled={disabled}>
                  <Icon icon="save" />
                </button>
              </MenuButtons.Main>
            );
          }
          return (
            <NeedAuthorization roles={['admin', 'editor']}>
              <MenuButtons.Main
                onClick={() =>
                  this.props.loadInReduxForm(
                    'documentViewer.docForm',
                    this.props.doc.toJS(),
                    this.props.templates.toJS()
                  )
                }
              >
                <Icon icon="pencil-alt" />
              </MenuButtons.Main>
            </NeedAuthorization>
          );
        })()}
      </div>
    );
  }
}

MetadataPanelMenu.propTypes = {
  templates: PropTypes.object,
  doc: PropTypes.object,
  docForm: PropTypes.object,
  formState: PropTypes.object,
  loadInReduxForm: PropTypes.func,
  targetDoc: PropTypes.bool,
};

const mapStateToProps = ({ documentViewer, templates }) => ({
  doc: documentViewer.doc,
  templates,
  docForm: documentViewer.docForm,
  formState: documentViewer.docFormState,
  targetDoc: !!documentViewer.targetDoc.get('_id'),
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ loadInReduxForm: actions.loadInReduxForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataPanelMenu);
