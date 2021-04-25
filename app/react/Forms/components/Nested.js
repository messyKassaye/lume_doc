import PropTypes from 'prop-types';
import React, { Component } from 'react';
import MarkDown from './MarkDown';

export default class Nested extends Component {
  constructor(props) {
    super(props);
    this.state = { value: this.parseValue(this.props.value) };
  }

  parseValue(rows = []) {
    if (!rows[0]) {
      return '';
    }

    const keys = Object.keys(rows[0]).sort();
    let result = `| ${keys.join(' | ')} |\n`;
    result += `| ${keys.map(() => '-').join(' | ')} |\n`;
    result += `${rows
      .map(row => `| ${keys.map(key => (row[key] || []).join(',')).join(' | ')}`)
      .join(' |\n')} |`;

    return result;
  }

  onChange(e) {
    const value = e.target.value || '';
    let formatedValues = [];
    this.setState({ value });
    if (value) {
      const rows = value.split('\n').filter(row => row);
      const keys = rows[0]
        .split('|')
        .map(key => key.trim())
        .filter(key => key);
      const entries = rows.splice(2);
      formatedValues = entries.map(row =>
        row
          .split('|')
          .splice(1)
          .reduce((result, val, index) => {
            if (!keys[index]) {
              return result;
            }
            const values = val
              .split(',')
              .map(v => v.trim())
              .filter(v => v);
            result[keys[index]] = values;
            return result;
          }, {})
      );
    }

    this.props.onChange(formatedValues);
  }

  render() {
    return <MarkDown onChange={this.onChange.bind(this)} value={this.state.value} />;
  }
}

Nested.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.array,
};
