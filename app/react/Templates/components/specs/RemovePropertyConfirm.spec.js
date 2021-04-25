import React from 'react';
import { shallow } from 'enzyme';

import { RemovePropertyConfirm } from 'app/Templates/components/RemovePropertyConfirm';
import Modal from 'app/Layout/Modal.js';

describe('RemovePropertyConfirm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      removeProperty: jasmine.createSpy('removeProperty'),
      propertyBeingDeleted: 1,
    };
  });

  const render = () => {
    component = shallow(<RemovePropertyConfirm {...props} />);
  };

  it('should render a default closed modal', () => {
    render();
    expect(component.find(Modal).props().isOpen).toBe(false);
  });

  it('should pass isOpen', () => {
    props.isOpen = true;
    render();
    expect(component.find(Modal).props().isOpen).toBe(true);
  });

  describe('when clicking confirm button', () => {
    it('should call removeProperty and hideRemovePropertyConfirm', () => {
      render();
      component.find('.confirm-button').simulate('click');
      expect(props.removeProperty).toHaveBeenCalledWith(1);
      expect(props.hideModal).toHaveBeenCalledWith('RemovePropertyModal');
    });
  });

  describe('when clicking cancel button or close button', () => {
    it('should call hideRemovePropertyConfirm', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('RemovePropertyModal');
    });
  });
});
