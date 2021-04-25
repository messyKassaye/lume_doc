import Immutable from 'immutable';

import uiReducer from '../uiReducer';
import * as actions from '../../actions/uiActions';

describe('uiReducer', () => {
  const initialState = Immutable.fromJS({});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = uiReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('when showTab', () => {
    it('should set tab passed and showFilters to false', () => {
      const newState = uiReducer(initialState, actions.showTab('tab'));
      expect(newState.toJS()).toEqual({ tab: 'tab', showFilters: false });
    });
  });

  describe('when showFilters', () => {
    it('should set tab to connections and filters true', () => {
      const newState = uiReducer(initialState, actions.showFilters());
      expect(newState.toJS()).toEqual({ tab: 'connections', showFilters: true });
    });
  });

  describe('when hideFilters', () => {
    it('should set tab to connections and filters true', () => {
      const newState = uiReducer(initialState, actions.hideFilters());
      expect(newState.toJS()).toEqual({ showFilters: false });
    });
  });
});
