/** @format */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { MetadataFormFields, validator, wrapEntityMetadata } from 'app/Metadata';
import { LocalForm, actions, Control } from 'react-redux-form';
import { Captcha } from 'app/ReactReduxForms';
import { Translate } from 'app/I18N';
import { publicSubmit } from 'app/Uploads/actions/uploadsActions';
import { bindActionCreators } from 'redux';
import { FormGroup } from 'app/Forms';
import Loader from 'app/components/Elements/Loader';

class PublicForm extends Component {
  static renderTitle(template) {
    const titleLabel = template
      .get('commonProperties')
      .find(p => p.get('name') === 'title')
      .get('label');

    return (
      <FormGroup key="title" model=".title">
        <ul className="search__filter">
          <li>
            <label htmlFor="title">
              <Translate context={template.get('_id')}>{titleLabel}</Translate>
              <span className="required">*</span>
            </label>
          </li>
          <li className="wide">
            <Control.text id="title" className="form-control" model=".title" />
          </li>
        </ul>
      </FormGroup>
    );
  }

  static renderSubmitState() {
    return (
      <div className="public-form submiting">
        <h3>
          <Translate>Submiting</Translate>
        </h3>
        <Loader />
      </div>
    );
  }

  static renderFileField(id, options) {
    const defaults = { className: 'form-control', model: `.${id}` };
    const props = Object.assign(defaults, options);
    return (
      <div className="form-group">
        <ul className="search__filter">
          <li>
            <label htmlFor={id}>
              <Translate>{id === 'file' ? 'Document' : 'Attachments'}</Translate>
              <Control.file id={id} {...props} />
            </label>
          </li>
        </ul>
      </div>
    );
  }

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validators = {
      captcha: { required: val => val && val.text.length },
      ...validator.generate(props.template.toJS()),
    };
    this.state = { submiting: false };
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  resetForm() {
    this.formDispatch(actions.reset('publicform'));
  }

  handleSubmit(_values) {
    const values = wrapEntityMetadata(_values);
    const { submit, template, remote } = this.props;
    values.file = _values.file ? _values.file[0] : undefined;
    values.template = template.get('_id');

    submit(values, remote)
      .then(uploadCompletePromise => {
        this.setState({ submiting: true });
        return uploadCompletePromise.promise
          .then(() => {
            this.setState({ submiting: false });
            this.resetForm();
            this.refreshCaptcha();
          })
          .catch(() => {
            this.setState({ submiting: false });
            this.refreshCaptcha();
          });
      })
      .catch(() => {
        this.setState({ submiting: false });
        this.refreshCaptcha();
      });
  }

  renderCaptcha() {
    const { remote } = this.props;
    return (
      <FormGroup key="captcha" model=".captcha">
        <ul className="search__filter">
          <li>
            <label>
              <Translate>Captcha</Translate>
              <span className="required">*</span>
            </label>
          </li>
          <li className="wide">
            <Captcha
              remote={remote}
              refresh={refresh => {
                this.refreshCaptcha = refresh;
              }}
              model=".captcha"
            />
          </li>
        </ul>
      </FormGroup>
    );
  }

  render() {
    const { template, thesauris, file, attachments } = this.props;
    const { submiting } = this.state;
    return (
      <LocalForm
        validators={this.validators}
        model="publicform"
        getDispatch={dispatch => this.attachDispatch(dispatch)}
        onSubmit={this.handleSubmit}
      >
        {submiting ? (
          PublicForm.renderSubmitState()
        ) : (
          <div className="public-form">
            {PublicForm.renderTitle(template)}
            <MetadataFormFields thesauris={thesauris} model="publicform" template={template} />
            {file ? PublicForm.renderFileField('file', { accept: '.pdf' }) : false}
            {attachments
              ? PublicForm.renderFileField('attachments', { multiple: 'multiple' })
              : false}
            {this.renderCaptcha()}
            <input type="submit" className="btn btn-success" value="Submit" />
          </div>
        )}
      </LocalForm>
    );
  }
}

PublicForm.propTypes = {
  file: PropTypes.bool.isRequired,
  attachments: PropTypes.bool.isRequired,
  remote: PropTypes.bool.isRequired,
  template: PropTypes.instanceOf(Immutable.Map).isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  submit: PropTypes.func.isRequired,
};

export const mapStateToProps = (state, props) => ({
  template: state.templates.find(template => template.get('_id') === props.template),
  thesauris: state.thesauris,
  file: props.file !== undefined,
  remote: props.remote !== undefined,
  attachments: props.attachments !== undefined,
});

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({ submit: publicSubmit }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PublicForm);
