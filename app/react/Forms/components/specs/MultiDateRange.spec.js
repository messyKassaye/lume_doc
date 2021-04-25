/** @format */

import React from 'react';
import { shallow } from 'enzyme';

import MultiDateRange from '../MultiDateRange';
import DatePicker from '../DatePicker';

describe('MultiDateRange', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      value: [
        { from: 1473984000, to: 1473984001 },
        { from: 1474156800, to: 1474156801 },
      ],
      onChange: jasmine.createSpy('onChange'),
    };
  });

  const render = () => {
    component = shallow(<MultiDateRange {...props} />);
  };

  it('should render a pair of DatePickers for each value', () => {
    render();
    const datepickers = component.find(DatePicker);
    expect(datepickers.length).toBe(4);
  });

  describe('changing a datepicker', () => {
    it('should call onChange with the new array of values', () => {
      render();
      const datepickers = component.find(DatePicker);
      datepickers.first().simulate('change', 1234);
      expect(props.onChange).toHaveBeenCalledWith([
        { from: 1234, to: 1473984001 },
        { from: 1474156800, to: 1474156801 },
      ]);
    });
  });

  describe('adding a date', () => {
    it('should add a value to the state', () => {
      render();
      const addButton = component.find('.btn-success');
      addButton.simulate('click', { preventDefault: () => {} });
      expect(component.state().values).toEqual([
        { from: 1473984000, to: 1473984001 },
        { from: 1474156800, to: 1474156801 },
        { from: null, to: null },
      ]);
    });
  });

  describe('removing a date', () => {
    it('should remove the value from the state', () => {
      render();
      const removeButtons = component.find('.react-datepicker__delete-icon');
      removeButtons.first().simulate('click', { preventDefault: () => {} });
      expect(component.state().values).toEqual([{ from: 1474156800, to: 1474156801 }]);
      expect(props.onChange).toHaveBeenCalledWith([{ from: 1474156800, to: 1474156801 }]);
    });
  });
});
