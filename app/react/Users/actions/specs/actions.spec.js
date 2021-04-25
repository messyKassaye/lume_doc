import { actions as basicActions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import api from 'app/Users/UsersAPI';
import { RequestParams } from 'app/utils/RequestParams';
import * as actions from '../actions';

describe('User actions', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'delete').and.returnValue(Promise.resolve());
    spyOn(api, 'save').and.returnValue(Promise.resolve());
    spyOn(basicActions, 'remove').and.returnValue('USER REMOVED');
    spyOn(basicActions, 'push').and.returnValue('USER PUSHED');
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('deleteUser', () => {
    it('should delete the user', () => {
      actions.deleteUser({ _id: '231' })(dispatch);
      expect(api.delete).toHaveBeenCalledWith(new RequestParams({ _id: '231' }));
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions
          .deleteUser('data')(dispatch)
          .then(() => {
            done();
          });
      });

      it('should remove user', () => {
        expect(basicActions.remove).toHaveBeenCalledWith('users', 'data');
        expect(dispatch).toHaveBeenCalledWith('USER REMOVED');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });
    });
  });

  describe('saveUser', () => {
    const username = 'Spidey';
    const email = 'peter@parker.com';
    it('should save a new user', () => {
      actions.saveUser({ username, email })(dispatch);
      expect(api.save).toHaveBeenCalledWith(new RequestParams({ username, email }));
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions
          .saveUser({ username, email })(dispatch)
          .then(() => {
            done();
          });
      });

      it('should remove user', () => {
        expect(basicActions.push).toHaveBeenCalledWith('users', { username, email });
        expect(dispatch).toHaveBeenCalledWith('USER PUSHED');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });
    });
  });
});
