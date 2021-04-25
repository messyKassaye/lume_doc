import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import Notification from 'app/Notifications/components/Notification';

export class Notifications extends Component {
  render() {
    return (
      <div className="alert-wrapper">
        {this.props.notifications.map(notification => (
          <Notification key={notification.id} {...notification} />
        ))}
      </div>
    );
  }
}

Notifications.propTypes = {
  notifications: PropTypes.array,
};

const mapStateToProps = state => ({ notifications: state.notifications.toJS() });

export default connect(mapStateToProps)(Notifications);
