import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { actions as formActions, Field, Form } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { BackButton } from 'app/Layout';
import { Icon } from 'UI';

import FormGroup from 'app/DocumentForm/components/FormGroup';
import { saveRelationType, resetRelationType } from 'app/RelationTypes/actions/relationTypeActions';

export class RelationTypeForm extends Component {
  componentWillUnmount() {
    this.props.resetForm('relationType');
    this.props.setInitial('relationType');
  }

  validation(relationTypes, id) {
    return {
      name: {
        required: val => val && val.trim() !== '',
        duplicated: val => {
          const name = val || '';
          return !relationTypes.find(
            relationType =>
              relationType._id !== id &&
              relationType.name.trim().toLowerCase() === name.trim().toLowerCase()
          );
        },
      },
    };
  }

  render() {
    return (
      <div className="relationType">
        <Form
          model="relationType"
          onSubmit={this.props.saveRelationType}
          validators={this.validation(this.props.relationTypes.toJS(), this.props.relationType._id)}
        >
          <div className="panel panel-default">
            <div className="panel-heading">
              <FormGroup {...this.props.state.name} submitFailed={this.props.state.submitFailed}>
                <Field model=".name">
                  <input
                    id="relationTypeName"
                    className="form-control"
                    type="text"
                    placeholder="Connection name"
                  />
                  {(() => {
                    if (
                      this.props.state.dirty &&
                      this.props.state.fields.name &&
                      this.props.state.fields.name.errors.duplicated
                    ) {
                      return (
                        <div className="validation-error">
                          <Icon icon="exclamation-triangle" /> Duplicated name
                        </div>
                      );
                    }
                  })()}
                </Field>
              </FormGroup>
            </div>
            <div className="panel-body">Currently connections only need a title.</div>
            <div className="settings-footer">
              <BackButton to="/settings/connections" />
              <button type="submit" className="btn btn-success save-template">
                <Icon icon="save" />
                <span className="btn-label">Save</span>
              </button>
            </div>
          </div>
        </Form>
      </div>
    );
  }
}

RelationTypeForm.propTypes = {
  relationType: PropTypes.object.isRequired,
  relationTypes: PropTypes.object,
  saveRelationType: PropTypes.func,
  resetRelationType: PropTypes.func,
  resetForm: PropTypes.func,
  setInitial: PropTypes.func,
  state: PropTypes.object,
};

export function mapStateToProps(state) {
  return {
    relationType: state.relationType,
    relationTypes: state.relationTypes,
    state: state.relationTypeForm,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      saveRelationType,
      resetRelationType,
      resetForm: formActions.reset,
      setInitial: formActions.setInitial,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationTypeForm);
