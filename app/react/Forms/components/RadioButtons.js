import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class RadioButtons extends Component {
  change(value) {
    this.props.onChange(value);
  }

  checked(value) {
    return value === this.props.value;
  }

  renderLabel(opt) {
    if (this.props.renderLabel) {
      return this.props.renderLabel(opt);
    }

    const { optionsLabel } = this.props;
    return opt[optionsLabel];
  }

  render() {
    const { optionsValue, prefix, options } = this.props;

    return (
      <div>
        {options.map(option => (
          <div className="radio" key={option[optionsValue]}>
            <label htmlFor={prefix + option[optionsValue]}>
              <input
                type="radio"
                value={option[optionsValue]}
                id={prefix + option[optionsValue]}
                onChange={this.change.bind(this, option[optionsValue])}
                checked={this.checked(option[optionsValue])}
              />
              <span className="multiselectItem-name">{this.renderLabel(option)}</span>
            </label>
          </div>
        ))}
      </div>
    );
  }
}

RadioButtons.defaultProps = {
  optionsLabel: 'label',
  optionsValue: 'value',
  prefix: '',
  renderLabel: undefined,
  value: null,
};

RadioButtons.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired,
  value: PropTypes.any,
  optionsValue: PropTypes.string,
  optionsLabel: PropTypes.string,
  prefix: PropTypes.string,
  renderLabel: PropTypes.func,
};
