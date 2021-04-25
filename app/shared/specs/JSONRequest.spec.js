import backend from 'fetch-mock';

import request from '../JSONRequest';

describe('JSONRequest', () => {
  beforeEach(() => {
    backend.restore();
    backend
      .post('http://localhost:3000/api/test', JSON.stringify({ response: 'post' }))
      .put('http://localhost:3000/api/test', JSON.stringify({ response: 'put' }))
      .get('http://localhost:3000/api/test', JSON.stringify({ response: 'get' }))
      .get(
        'http://localhost:3000/api/withParams?param1=param1&param2=%7B%22value%22%3A2%7D',
        JSON.stringify({ response: 'get with params' })
      )
      .get(
        'http://localhost:3000/api/withParams?param1=param1&param2=%7B%22value%22%3A2%7D&q=(order:desc,sort:creationDate)',
        JSON.stringify({ response: 'get with params and rison "q"' })
      )
      .get(
        'http://localhost:3000/api/withParams?param1=param1&param2=%7B%22value%22%3A2%7D&q=%7Bunable%3A%20%22to%20decode%22%7D',
        JSON.stringify({ response: 'get with params and undecodable q' })
      )
      .delete('http://localhost:3000/api/test', JSON.stringify({ response: 'delete' }))
      .delete(
        'http://localhost:3000/api/test?id=123',
        JSON.stringify({ response: 'delete with params' })
      );
  });

  describe('post()', () => {
    describe('set-cookie', () => {
      it('should return the set-cookie param when set', async () => {
        backend.restore();
        backend.post('http://localhost:3000/api/test', {
          body: JSON.stringify({ response: 'post' }),
          headers: { 'set-cookie': 'cookie' },
        });
        const response = await request.post('http://localhost:3000/api/test');
        expect(response.cookie).toEqual('cookie');
      });
    });

    it('should POST to the url and return the response json and the status', done => {
      request
        .post('http://localhost:3000/api/test')
        .then(response => {
          expect(response.status).toBe(200);
          expect(response.json).toEqual({ response: 'post' });
          done();
        })
        .catch(done.fail);
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', done => {
        backend.restore().post('http://localhost:3000/api/test', {
          status: 400,
          body: JSON.stringify({ error: 'error!' }),
        });

        request
          .post('http://localhost:3000/api/test')
          .then(() => {
            done.fail('should have thrown an error');
          })
          .catch(response => {
            expect(response.json.error).toBe('error!');
            expect(response.status).toBe(400);
            done();
          });
      });
    });

    describe('when passing headers', () => {
      it('should send them (with some default headers)', done => {
        request
          .post('http://localhost:3000/api/test', {}, { Cookie: 'cookie' })
          .then(() => {
            const { headers } = backend.calls()[0][1];
            expect(headers.Cookie).toBe('cookie');
            expect(headers['X-Requested-With']).toBe('XMLHttpRequest');
            done();
          })
          .catch(done.fail);
      });
    });

    describe('when authorizing', () => {
      it('should send the authorization cookie in the headers', async () => {
        request.cookie('cookie');
        await request.get('http://localhost:3000/api/test');
        const { headers } = backend.calls()[0][1];
        expect(headers.Cookie).toBe('cookie');
      });
    });
  });

  describe('put()', () => {
    it('should PUT to the url and return the response json and the status', done => {
      request
        .put('http://localhost:3000/api/test')
        .then(response => {
          expect(response.status).toBe(200);
          expect(response.json).toEqual({ response: 'put' });
          done();
        })
        .catch(done.fail);
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', done => {
        backend.restore().put('http://localhost:3000/api/test', {
          status: 400,
          body: JSON.stringify({ error: 'error!' }),
        });

        request
          .put('http://localhost:3000/api/test')
          .then(() => {
            done.fail('should have thrown an error');
          })
          .catch(response => {
            expect(response.json.error).toBe('error!');
            expect(response.status).toBe(400);
            done();
          });
      });
    });

    describe('when passing headers', () => {
      it('should send them', done => {
        request
          .put('http://localhost:3000/api/test', {}, { Cookie: 'cookie' })
          .then(() => {
            const { headers } = backend.calls()[0][1];
            expect(headers.Cookie).toBe('cookie');

            done();
          })
          .catch(done.fail);
      });
    });
  });

  describe('get()', () => {
    it('should GET to the url and return the response json and the status', done => {
      request
        .get('http://localhost:3000/api/test')
        .then(response => {
          expect(response.status).toBe(200);
          expect(response.json).toEqual({ response: 'get' });
          done();
        })
        .catch(done.fail);
    });

    describe('when passing data', () => {
      it('should transform it to url params and not send a body', done => {
        let undefinedVar;
        request
          .get('http://localhost:3000/api/withParams', {
            param1: 'param1',
            param2: { value: 2 },
            paramNull: null,
            paramUndefined: undefinedVar,
          })
          .then(response => {
            expect(response.status).toBe(200);
            expect(response.json).toEqual({ response: 'get with params' });
            expect(backend.lastOptions().body).not.toBeDefined();
            done();
          })
          .catch(done.fail);
      });
    });

    describe('when passing rison encoded data', () => {
      it('should transform only non rison (q) params and not send a body', done => {
        request
          .get('http://localhost:3000/api/withParams', {
            param1: 'param1',
            param2: { value: 2 },
            q: '(order:desc,sort:creationDate)',
          })
          .then(response => {
            expect(response.status).toBe(200);
            expect(response.json).toEqual({ response: 'get with params and rison "q"' });
            expect(backend.lastOptions().body).not.toBeDefined();
            done();
          })
          .catch(done.fail);
      });

      it('should transform q if its content is not able to be rison decoded', done => {
        request
          .get('http://localhost:3000/api/withParams', {
            param1: 'param1',
            param2: { value: 2 },
            q: '{unable: "to decode"}',
          })
          .then(response => {
            expect(response.status).toBe(200);
            expect(response.json).toEqual({ response: 'get with params and undecodable q' });
            expect(backend.lastOptions().body).not.toBeDefined();
            done();
          })
          .catch(done.fail);
      });
    });

    describe('when passing headers', () => {
      it('should send them', done => {
        request
          .get('http://localhost:3000/api/test', {}, { Cookie: 'cookie' })
          .then(() => {
            const { headers } = backend.calls()[0][1];
            expect(headers.Cookie).toBe('cookie');

            done();
          })
          .catch(done.fail);
      });
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', done => {
        backend.restore().get('http://localhost:3000/api/test', {
          status: 500,
          body: JSON.stringify({ error: 'error!' }),
        });

        request
          .get('http://localhost:3000/api/test')
          .then(() => {
            done.fail('should have thrown an error');
          })
          .catch(response => {
            expect(response.json.error).toBe('error!');
            expect(response.status).toBe(500);
            done();
          });
      });
    });
  });

  describe('delete()', () => {
    describe('when passing headers', () => {
      it('should send them', done => {
        request
          .delete('http://localhost:3000/api/test', {}, { Cookie: 'cookie' })
          .then(() => {
            const { headers } = backend.calls()[0][1];
            expect(headers.Cookie).toBe('cookie');

            done();
          })
          .catch(done.fail);
      });
    });

    it('should DELETE to the url and return the response json and the status', done => {
      request
        .delete('http://localhost:3000/api/test')
        .then(response => {
          expect(response.status).toBe(200);
          expect(response.json).toEqual({ response: 'delete' });
          done();
        })
        .catch(done.fail);
    });

    describe('when passing data', () => {
      it('should send it in params', done => {
        request
          .delete('http://localhost:3000/api/test', { id: '123' })
          .then(response => {
            expect(response.status).toBe(200);
            expect(response.json).toEqual({ response: 'delete with params' });
            done();
          })
          .catch(done.fail);
      });
    });

    describe('when response is greater than 399', () => {
      it('should throw an error', done => {
        backend.restore().delete('http://localhost:3000/api/test', {
          status: 404,
          body: JSON.stringify({ error: 'error!' }),
        });

        request
          .delete('http://localhost:3000/api/test')
          .then(() => {
            done.fail('should have thrown an error');
          })
          .catch(response => {
            expect(response.status).toBe(404);
            expect(response.json.error).toBe('error!');
            done();
          });
      });
    });
  });

  describe('head', () => {
    it('should request the headers for the given url', async () => {
      const mockresponse = {
        body: JSON.stringify({ text: 'hey' }),
      };
      backend
        .restore()
        .head('http://localhost:3000/hello', JSON.stringify({ response: mockresponse }));

      const response = await request.head('http://localhost:3000/hello');
      const { method } = backend.calls()[0][1];

      expect(method).toBe('HEAD');
      expect(response.headers).toBeDefined();
    });
  });
});
