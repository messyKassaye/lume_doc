import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { t } from 'app/I18N';
import Numeric from './Numeric';

export default class NumericRange extends Component {
  constructor(props) {
    super(props);
    const value = props.value || {};
    this.state = { from: value.from, to: value.to };
  }

  onChange(prop, value) {
    const newState = {
      ...this.state,
      [prop]: value,
    };

    this.setState(newState);

    const { from, to } = newState;

    this.props.onChange({
      ...(from !== '' ? { from } : {}),
      ...(to !== '' ? { to } : {}),
    });
  }

  render() {
    return (
      <div>
        <div className="Numeric__From">
          <span>{t('System', 'Label date "From"')}</span>
          <Numeric value={this.state.from} onChange={val => this.onChange('from', val)} />
        </div>
        <div className="Numeric__To">
          <span>&nbsp;{t('System', 'Label date "to"')}</span>
          <Numeric value={this.state.to} onChange={val => this.onChange('to', val)} />
        </div>
      </div>
    );
  }
}

NumericRange.propTypes = {
  model: PropTypes.string,
  value: PropTypes.object,
  onChange: PropTypes.func,
};
