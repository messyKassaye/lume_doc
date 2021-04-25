import { catchErrors } from 'api/utils/jasmineHelpers';
import instrumentRoutes from 'api/utils/instrumentRoutes';

import userRoutes from '../routes.js';
import users from '../users.js';

describe('users routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(userRoutes);
  });

  describe('POST', () => {
    describe('/users', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/users')).toMatchSnapshot();
      });

      it('should call users save with the body', done => {
        spyOn(users, 'save').and.returnValue(Promise.resolve());
        const req = {
          body: 'changes',
          user: { _id: 'currentUser' },
          protocol: 'http',
          get: () => 'localhost',
        };
        routes
          .post('/api/users', req)
          .then(() => {
            expect(users.save).toHaveBeenCalledWith(
              'changes',
              { _id: 'currentUser' },
              'http://localhost'
            );
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('/users/new', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/users/new')).toMatchSnapshot();
      });

      it('should call users newUser with the body', done => {
        spyOn(users, 'newUser').and.returnValue(Promise.resolve());
        const req = {
          body: 'changes',
          user: { _id: 'currentUser' },
          protocol: 'http',
          get: () => 'localhost',
        };
        routes
          .post('/api/users/new', req)
          .then(() => {
            expect(users.newUser).toHaveBeenCalledWith('changes', 'http://localhost');
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('/recoverpassword', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/recoverpassword')).toMatchSnapshot();
      });

      it('should call users update with the body email', done => {
        spyOn(users, 'recoverPassword').and.returnValue(Promise.resolve());
        const req = { body: { email: 'recover@me.com' }, protocol: 'http', get: () => 'localhost' };
        routes
          .post('/api/recoverpassword', req)
          .then(response => {
            expect(response).toBe('OK');
            expect(users.recoverPassword).toHaveBeenCalledWith(
              'recover@me.com',
              'http://localhost'
            );
            done();
          })
          .catch(catchErrors(done));
      });

      it('should return an error if recover password fails', async () => {
        spyOn(users, 'recoverPassword').and.returnValue(Promise.reject(new Error('error')));
        const req = { body: { email: 'recover@me.com' }, protocol: 'http', get: () => 'localhost' };

        try {
          await routes.post('/api/recoverpassword', req);
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });

    describe('/resetpassword', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/resetpassword')).toMatchSnapshot();
      });

      it('should call users update with the body', done => {
        spyOn(users, 'resetPassword').and.returnValue(Promise.resolve());
        const req = { body: 'changes' };
        routes
          .post('/api/resetpassword', req)
          .then(() => {
            expect(users.resetPassword).toHaveBeenCalledWith('changes');
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('/unlockaccount', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/unlockaccount')).toMatchSnapshot();
      });

      it('should call users.unlockAccount with the body', done => {
        jest.spyOn(users, 'unlockAccount').mockResolvedValue();
        const req = { body: 'credentials' };
        routes
          .post('/api/unlockaccount', req)
          .then(() => {
            expect(users.unlockAccount).toHaveBeenCalledWith('credentials');
            done();
          })
          .catch(catchErrors(done));
      });
    });
  });

  describe('GET', () => {
    it('should need authorization', () => {
      spyOn(users, 'get').and.returnValue(Promise.resolve(['users']));
      const req = {};
      expect(routes.get('/api/users', req)).toNeedAuthorization();
    });

    it('should call users get', done => {
      spyOn(users, 'get').and.returnValue(Promise.resolve(['users']));
      const req = {};
      routes
        .get('/api/users', req)
        .then(res => {
          expect(users.get).toHaveBeenCalled();
          expect(res).toEqual(['users']);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should call next on error', async () => {
      spyOn(users, 'recoverPassword').and.returnValue(Promise.reject(new Error('error')));
      const req = { body: { email: 'recover@me.com' }, protocol: 'http', get: () => 'localhost' };

      try {
        await routes.post('/api/recoverpassword', req);
      } catch (error) {
        expect(error).toEqual(new Error('error'));
      }
    });
  });

  describe('DELETE', () => {
    let req;
    beforeEach(() => {
      req = { query: { _id: 123, username: 'Nooooooo!' }, user: { _id: 'currentUser' } };
      spyOn(users, 'delete').and.returnValue(Promise.resolve({ json: 'ok' }));
    });

    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/users')).toMatchSnapshot();
    });

    it('should need authorization', () => {
      expect(routes.delete('/api/users', req)).toNeedAuthorization();
    });

    it('should use users to delete it', done => {
      routes
        .delete('/api/users', req)
        .then(() => {
          expect(users.delete).toHaveBeenCalledWith(req.query._id, { _id: 'currentUser' });
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
