/* eslint-disable max-statements */
import { Application, NextFunction, Request, Response } from 'express';
import testingDB from 'api/utils/testing_db';

import { setUpApp } from 'api/utils/testingRoutes';
import userGroupRoutes from 'api/usergroups/routes';
import request, { Response as SuperTestResponse } from 'supertest';
import userGroups from '../userGroups';

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('usergroups routes', () => {
  let user: { username: string; role: string } | undefined;
  const defaultUserGroup: any = { _id: 'group1', name: 'group 1', members: [] };

  beforeAll(async () => {
    await testingDB.connect();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  const getUser = () => user;

  const app: Application = setUpApp(
    userGroupRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = getUser();
      next();
    }
  );

  async function getUserGroups(): Promise<SuperTestResponse> {
    return request(app)
      .get('/api/usergroups')
      .set('X-Requested-With', 'XMLHttpRequest');
  }

  async function postUserGroup(userGroupData = defaultUserGroup): Promise<SuperTestResponse> {
    return request(app)
      .post('/api/usergroups')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send(userGroupData);
  }

  async function deleteUserGroup(userGroupData = defaultUserGroup): Promise<SuperTestResponse> {
    return request(app)
      .delete('/api/usergroups')
      .set('X-Requested-With', 'XMLHttpRequest')
      .query({ _id: userGroupData._id });
  }

  describe('GET', () => {
    const groups = [{ name: 'group1' }];

    beforeEach(() => {
      spyOn(userGroups, 'get').and.returnValue(Promise.resolve(groups));
    });

    it('should query and return an array of existing user groups', async () => {
      user = { username: 'user 1', role: 'admin' };
      const response = await getUserGroups();
      expect(userGroups.get).toHaveBeenCalledWith({});
      expect(response.body).toEqual(groups);
    });
  });

  describe('POST', () => {
    const userGroup = { _id: 'group1', name: 'group 1', members: [] };
    beforeEach(() => {
      spyOn(userGroups, 'save').and.returnValue(Promise.resolve(userGroup));
    });

    it('should save a user group and return the updated data', async () => {
      user = { username: 'user 1', role: 'admin' };
      const response = await postUserGroup();
      expect(response.body._id).toEqual('group1');
      expect(userGroups.save).toHaveBeenCalledWith(userGroup);
    });

    describe('validation', () => {
      it('should return a validation error if user group data is not valid', async () => {
        user = { username: 'user 1', role: 'admin' };
        const response = await postUserGroup({ name: undefined });
        expect(response.status).toBe(400);
        expect(userGroups.save).not.toHaveBeenCalled();
        expect(response.body.errors[0].keyword).toBe('required');
        expect(response.body.errors[0].dataPath).toBe('.body');
        expect(response.body.error).toBe('validation failed');
      });

      it('should validate a user group that has an undefined user id', async () => {
        user = { username: 'user 1', role: 'admin' };
        const response = await postUserGroup({ name: 'group 1', members: [{ _id: undefined }] });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].keyword).toBe('required');
        expect(response.body.errors[0].dataPath).toBe('.body.members[0]');
        expect(response.body.error).toBe('validation failed');
      });

      it('should not validate an object with additional properties', async () => {
        user = { username: 'user 1', role: 'admin' };
        const response = await postUserGroup({
          name: 'group 1',
          other: 'invalid',
          members: [{ _id: 'user1', other: 'invalid1' }],
        });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].keyword).toBe('additionalProperties');
        expect(response.body.errors[0].dataPath).toBe('.body');
        expect(response.body.errors[1].keyword).toBe('additionalProperties');
        expect(response.body.errors[1].dataPath).toBe('.body.members[0]');
        expect(response.body.error).toBe('validation failed');
      });
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      user = { username: 'user 1', role: 'admin' };
      spyOn(userGroups, 'delete').and.returnValue(Promise.resolve({ _id: 'user1' }));
    });
    it('should delete the group with the specified query', async () => {
      const response = await deleteUserGroup({ _id: 'group1' });
      expect(response.status).toBe(200);
      expect(userGroups.delete).toHaveBeenCalledWith({ _id: 'group1' });
      expect(response.text).toBe('{"_id":"user1"}');
    });
    it('should not validate an object with invalid schema', async () => {
      const response = await deleteUserGroup({});
      expect(response.status).toBe(400);
      expect(userGroups.delete).not.toHaveBeenCalled();
      expect(response.body.errors[0].keyword).toBe('required');
    });
  });

  describe('authorization', () => {
    it.each([getUserGroups, postUserGroup, deleteUserGroup])(
      'should reject with unauthorized when user has not admin role',
      async (
        endpointCall:
          | (() => Promise<SuperTestResponse>)
          | ((args?: any) => Promise<SuperTestResponse>)
      ) => {
        user = { username: 'user 1', role: 'editor' };
        const response = await endpointCall();
        expect(response.unauthorized).toBe(true);
      }
    );

    it.each([getUserGroups, postUserGroup, deleteUserGroup])(
      'should reject with unauthorized when there is no user',
      async (
        endpointCall:
          | (() => Promise<SuperTestResponse>)
          | ((args?: any) => Promise<SuperTestResponse>)
      ) => {
        user = undefined;
        const response: request.Response = await endpointCall();
        expect(response.unauthorized).toBe(true);
      }
    );
  });
});
