import PropTypes from 'prop-types';
import React from 'react';

import { LookupMultiSelect, Switcher } from 'app/ReactReduxForms';

const SelectFilter = ({
  onChange,
  model,
  label,
  options,
  prefix,
  showBoolSwitch,
  sort,
  lookup,
  totalPossibleOptions,
}) => (
  <ul className="search__filter is-active">
    <li>
      {label}
      {showBoolSwitch && <Switcher model={`${model}.and`} prefix={prefix} onChange={onChange} />}
    </li>
    <li className="wide">
      <LookupMultiSelect
        model={`${model}.values`}
        prefix={prefix}
        options={options}
        onChange={onChange}
        sort={sort}
        lookup={lookup}
        totalPossibleOptions={totalPossibleOptions}
      />
    </li>
  </ul>
);

SelectFilter.defaultProps = {
  onChange: () => {},
  label: '',
  prefix: '',
  showBoolSwitch: false,
  sort: false,
  options: [],
  lookup: null,
  totalPossibleOptions: 0,
};

SelectFilter.propTypes = {
  model: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  prefix: PropTypes.string,
  showBoolSwitch: PropTypes.bool,
  sort: PropTypes.bool,
  options: PropTypes.array,
  totalPossibleOptions: PropTypes.number,
  lookup: PropTypes.func,
  label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
};

export default SelectFilter;
