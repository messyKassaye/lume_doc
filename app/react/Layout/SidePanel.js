import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class SidePanel extends Component {
  render() {
    const propsClass = this.props.className || '';
    return (
      <aside
        className={`side-panel ${propsClass} ${this.props.open ? 'is-active' : 'is-hidden'} ${
          this.props.mode
        } `}
      >
        {this.props.children}
      </aside>
    );
  }
}

SidePanel.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  className: PropTypes.string,
  open: PropTypes.bool,
  mode: PropTypes.string,
};

SidePanel.defaultProps = {
  mode: '',
};

export default SidePanel;
