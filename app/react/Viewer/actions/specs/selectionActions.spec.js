import * as actions from 'app/Viewer/actions/selectionActions';
import * as types from 'app/Viewer/actions/actionTypes';

describe('selectionActions', () => {
  describe('setSelection()', () => {
    it('should return a SET_SELECTION type action with the selection', () => {
      const action = actions.setSelection('sourceRange');
      expect(action).toEqual({ type: types.SET_SELECTION, sourceRange: 'sourceRange' });
    });
  });
  describe('unsetSelection()', () => {
    it('should return a UNSET_SELECTION type action with the selection', () => {
      const action = actions.unsetSelection();
      expect(action).toEqual({ type: types.UNSET_SELECTION });
    });
  });
  describe('setTargetSelection()', () => {
    it('should return a SET_TARGET_SELECTION type action with the selection', () => {
      const action = actions.setTargetSelection('targetRange');
      expect(action).toEqual({ type: types.SET_TARGET_SELECTION, targetRange: 'targetRange' });
    });
  });
  describe('unsetTargetSelection()', () => {
    it('should return a UNSET_TARGET_SELECTION type action with the selection', () => {
      const action = actions.unsetTargetSelection();
      expect(action).toEqual({ type: types.UNSET_TARGET_SELECTION });
    });
  });
});
