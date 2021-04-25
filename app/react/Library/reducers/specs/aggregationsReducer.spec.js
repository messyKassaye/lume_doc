import Immutable from 'immutable';
import * as actions from 'app/Library/actions/libraryActions';

import aggregationsReducer from 'app/Library/reducers/aggregationsReducer';

describe('aggregationsReducer', () => {
  const initialState = Immutable.fromJS({});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = aggregationsReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('initializeFiltersForm()', () => {
    it('should set the properties', () => {
      const state = Immutable.fromJS({});

      const newState = aggregationsReducer(
        state,
        actions.initializeFiltersForm({ aggregations: 'aggregations' })
      );
      expect(newState).toBe('aggregations');
    });
  });
});
