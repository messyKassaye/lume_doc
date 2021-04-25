import PropTypes from 'prop-types';
import React from 'react';
import { Icon } from 'UI';

const Tip = ({ children, icon, position }) => {
  const className = position ? `property-description-${position}` : 'property-description';
  return (
    <span className="property-help">
      <Icon icon={icon} />
      <div className={className}>{children}</div>
    </span>
  );
};

Tip.defaultProps = {
  icon: 'question-circle',
  position: '',
};

Tip.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  icon: PropTypes.string,
  position: PropTypes.string,
};

export default Tip;
