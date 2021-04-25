import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Select } from 'app/ReactReduxForms';
import { t } from 'app/I18N';
import { Warning } from 'app/Layout';
import { Translate } from 'app/I18N';
import PropertyConfigOptions from './PropertyConfigOptions';
import { checkErrorsOnLabel } from '../utils/checkErrorsOnLabel';

export class FormConfigSelect extends Component {
  static getDerivedStateFromProps(props, state) {
    return { warning: Boolean(state.initialContent !== props.content) };
  }

  static contentValidation() {
    return { required: val => val.trim() !== '' };
  }

  constructor(props) {
    super(props);
    this.state = { warning: false, initialContent: props.content };
  }

  render() {
    const { index, type, labelHasError, contentRequiredError, templateId } = this.props;
    const thesauris = this.props.thesauris.toJS();

    const options = thesauris.filter(
      thesauri => thesauri._id !== templateId && thesauri.type !== 'template'
    );

    return (
      <div>
        <div className={`form-group${labelHasError ? ' has-error' : ''}`}>
          <label>Label</label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control" />
          </Field>
        </div>

        <div className={contentRequiredError ? 'form-group has-error' : 'form-group'}>
          <label>
            {t('System', 'Select list')}
            <span className="required">*</span>
          </label>
          {this.state.warning && (
            <Warning inline>
              <Translate>
                All entities and documents that have already this property assigned will loose its
                current value
              </Translate>
            </Warning>
          )}
          <Select
            model={`template.data.properties[${index}].content`}
            options={options}
            optionsLabel="name"
            optionsValue="_id"
          />
        </div>

        <PropertyConfigOptions index={index} type={type} />
      </div>
    );
  }
}

FormConfigSelect.defaultProps = {
  labelHasError: false,
  contentRequiredError: false,
  templateId: '',
  content: '',
};

FormConfigSelect.propTypes = {
  thesauris: PropTypes.object,
  index: PropTypes.number,
  formKey: PropTypes.string,
  type: PropTypes.string.isRequired,
  labelHasError: PropTypes.bool,
  contentRequiredError: PropTypes.bool,
  templateId: PropTypes.string,
  content: PropTypes.string,
};

export function mapStateToProps(state, props) {
  const { template, thesauris } = state;
  return {
    labelHasError: checkErrorsOnLabel(state, props),
    contentRequiredError:
      template.formState.$form.errors[`properties.${props.index}.content.required`] &&
      template.formState.$form.submitFailed,
    templateId: template.data._id,
    thesauris,
    content: template.data.properties[props.index].content,
  };
}

export default connect(mapStateToProps)(FormConfigSelect);
