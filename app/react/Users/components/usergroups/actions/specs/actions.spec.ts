import * as api from 'app/Users/components/usergroups/UserGroupsAPI';
import { Dispatch } from 'redux';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { IStore } from 'app/istore';
import { RequestParams } from 'app/utils/RequestParams';
import { notificationActions } from 'app/Notifications';
import * as actions from '../actions';

jest.mock('app/Users/components/usergroups/UserGroupsAPI');

describe('User Groups actions', () => {
  const group2: UserGroupSchema = {
    _id: 'group2',
    name: 'Group 2',
    members: [{ _id: 'user1' }],
  };
  const userGroups = [{ _id: 'group1', members: [{ _id: 'user1' }, { _id: 'user2' }] }, group2];
  const newUserGroup: UserGroupSchema = {
    name: 'new group',
    members: [{ _id: 'user2' }],
  };

  let dispatch: Dispatch<IStore>;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'getGroups').and.returnValue(Promise.resolve(userGroups));
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('Load user groups', () => {
    it('should dispatch the fetched user groups ', async () => {
      await actions.loadUserGroups()(dispatch);
      expect(api.getGroups).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: 'userGroups/SET', value: userGroups });
    });
  });

  describe('Save user group', () => {
    describe('New user group', () => {
      beforeEach(async () => {
        spyOn(api, 'saveGroup').and.returnValue(
          Promise.resolve({ ...newUserGroup, _id: 'group3' })
        );
        await actions.saveUserGroup(newUserGroup)(dispatch);
      });

      it('should dispatch a push action with a new user group ', () => {
        expect(api.saveGroup).toHaveBeenCalledWith(new RequestParams(newUserGroup));
        expect(dispatch).toHaveBeenCalledWith({
          type: 'userGroups/PUSH',
          value: { ...newUserGroup, _id: 'group3' },
        });
      });

      it('should dispatch a notification of success', () => {
        expect(notificationActions.notify).toHaveBeenCalledWith('Group created', 'success');
      });
    });

    describe('Existing user group', () => {
      let updatedGroup2: UserGroupSchema;
      beforeEach(async () => {
        updatedGroup2 = {
          ...group2,
          name: 'Group 2 updated',
          members: [{ _id: 'user1', username: 'User 1' }],
        };
        spyOn(api, 'saveGroup').and.returnValue(
          Promise.resolve({ ...group2, name: 'Group 2 updated' })
        );
        await actions.saveUserGroup(updatedGroup2)(dispatch);
      });

      it('should dispatch an update action keeping group members detail ', () => {
        expect(api.saveGroup).toHaveBeenCalledWith(new RequestParams(updatedGroup2));
        expect(dispatch).toHaveBeenCalledWith({
          type: 'userGroups/UPDATE',
          value: updatedGroup2,
        });
      });

      it('should dispatch a notification of success', () => {
        expect(notificationActions.notify).toHaveBeenCalledWith('Group updated', 'success');
      });
    });
  });

  describe('Delete user group', () => {
    beforeEach(async () => {
      spyOn(api, 'deleteGroup').and.returnValue(Promise.resolve(group2));
      await actions.deleteUserGroup(group2)(dispatch);
    });

    it('should dispatch a remove action of the deleted user group', () => {
      expect(api.deleteGroup).toHaveBeenCalledWith(new RequestParams({ _id: group2._id }));
      expect(dispatch).toHaveBeenCalledWith({
        type: 'userGroups/REMOVE',
        value: group2,
      });
    });

    it('should dispatch a notification of success', () => {
      expect(notificationActions.notify).toHaveBeenCalledWith('Group deleted', 'success');
    });
  });
});
