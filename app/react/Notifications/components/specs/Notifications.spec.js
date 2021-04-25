import React from 'react';
import { shallow } from 'enzyme';

import { Notifications } from 'app/Notifications/components/Notifications';
import Notification from 'app/Notifications/components/Notification';

describe('Notifications', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      notifications: [
        { message: '1', type: '1', id: 1 },
        { message: '2', type: '2', id: 2 },
      ],
    };
    component = shallow(<Notifications {...props} />);
  });

  it('should render all notifications passed', () => {
    const notifications = component.find(Notification);

    expect(notifications.first().props()).toEqual({ message: '1', type: '1', id: 1 });
    expect(notifications.last().props()).toEqual({ message: '2', type: '2', id: 2 });
  });
});
