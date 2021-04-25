import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { mockID } from 'shared/uniqueID.js';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';

import * as actions from '../actions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Connections actions', () => {
  let store;
  const getState = () => ({ locale: 'es' });

  beforeEach(() => {
    mockID();
    store = mockStore({});
    spyOn(api, 'get').and.returnValue(
      Promise.resolve({
        json: {
          rows: [
            { title: 'Southern Nights', documents: [], attachments: [] },
            { title: 'elenore', documents: [{ originalName: 'The Turtles' }], attachments: [] },
          ],
        },
      })
    );
    spyOn(api, 'post').and.callFake(url => {
      if (url === 'relationships/bulk') {
        return Promise.resolve({ status: 200, json: 'bulkResponse(ArrayOfTwo)' });
      }

      return Promise.reject('Unexpected url');
    });
  });

  describe('Search-related actions', () => {
    describe('immidiateSearch', () => {
      it('should search for connections', () => {
        actions.immidiateSearch(store.dispatch, 'term');
        const expectedParams = new RequestParams({ searchTerm: 'term', fields: ['title'] });
        expect(api.get).toHaveBeenCalledWith('search', expectedParams);
        expect(store.getActions()).toContainEqual({ type: 'SEARCHING_CONNECTIONS' });
      });

      it('should set the results upon response', done => {
        actions.immidiateSearch(store.dispatch, 'term').then(() => {
          const expectedAction = {
            type: 'connections/searchResults/SET',
            value: [
              { title: 'Southern Nights', documents: [], attachments: [] },
              { title: 'elenore', documents: [{ originalName: 'The Turtles' }], attachments: [] },
            ],
          };
          expect(store.getActions()).toContainEqual(expectedAction);
          done();
        });
      });

      describe('when doing a reference to a paragraph', () => {
        it('should not include entities without documents', done => {
          actions.immidiateSearch(store.dispatch, 'term', 'targetRanged').then(() => {
            expect(store.getActions()).toContainEqual({
              type: 'connections/searchResults/SET',
              value: [
                { attachments: [], documents: [{ originalName: 'The Turtles' }], title: 'elenore' },
              ],
            });
            done();
          });
        });
      });
    });

    describe('search', () => {
      it('should update the state searchTerm and debounce server searching the term', () => {
        jasmine.clock().install();

        actions.search('term', 'basic')(store.dispatch);
        expect(store.getActions()).toContainEqual({
          type: 'connections/searchTerm/SET',
          value: 'term',
        });
        expect(api.get).not.toHaveBeenCalled();

        jasmine.clock().tick(400);

        expect(api.get).toHaveBeenCalledWith(
          'search',
          new RequestParams({ searchTerm: 'term', fields: ['title'] })
        );
        jasmine.clock().uninstall();
      });
    });
  });

  describe('startNewConnection', () => {
    it('should perform an immediate empty search', () => {
      actions.startNewConnection('type', 'sourceId')(store.dispatch);
      expect(api.get).toHaveBeenCalledWith(
        'search',
        new RequestParams({ searchTerm: '', fields: ['title'] })
      );
    });

    it('should restore default search term and open the panel', done => {
      actions
        .startNewConnection(
          'type',
          'souceId'
        )(store.dispatch)
        .then(() => {
          expect(store.getActions()).toContainEqual({
            type: 'connections/searchTerm/SET',
            value: '',
          });
          expect(store.getActions()).toContainEqual({
            type: 'OPEN_CONNECTION_PANEL',
            sourceDocument: 'souceId',
            connectionType: 'type',
          });
          done();
        });
    });
  });

  describe('setRelationType', () => {
    it('should broadcast the new connection type', () => {
      expect(actions.setRelationType('newType')).toEqual({
        type: 'SET_RELATION_TYPE',
        template: 'newType',
      });
    });
  });

  describe('setTargetDocument', () => {
    it('should broadcast the id of the target', () => {
      expect(actions.setTargetDocument('targetId')).toEqual({
        type: 'SET_TARGET_DOCUMENT',
        id: 'targetId',
      });
    });
  });

  describe('saveConnection', () => {
    let connection;

    beforeEach(() => {
      connection = {
        sourceDocument: 'sourceId',
        type: 'basic',
        sourceRange: {
          selectionRectangles: [{ top: 20, left: 42, height: 13, width: 84 }],
          text: 'source text',
        },
        targetDocument: 'targetId',
        template: 'relationTypeId',
      };
    });

    it('should set the creating flag to true and attempt to save the connection (using the new hub format)', () => {
      const expectedParams = new RequestParams({
        delete: [],
        save: [
          [
            {
              entity: 'sourceId',
              template: null,
              reference: {
                selectionRectangles: [{ top: 20, left: 42, height: 13, width: 84 }],
                text: 'source text',
              },
            },
            { entity: 'targetId', template: 'relationTypeId' },
          ],
        ],
      });

      actions.saveConnection(connection)(store.dispatch, getState);
      expect(store.getActions()).toEqual([{ type: 'CREATING_CONNECTION' }]);
      expect(api.post).toHaveBeenCalledWith('relationships/bulk', expectedParams);
    });

    it('should allow for targetted range connections (using the new hub format)', () => {
      connection.targetRange = {
        selectionRectangles: [{ top: 28, left: 12, height: 13, width: 84 }],
        text: 'target text',
      };

      const expectedParams = new RequestParams({
        delete: [],
        save: [
          [
            {
              entity: 'sourceId',
              template: null,
              reference: {
                selectionRectangles: [{ top: 20, left: 42, height: 13, width: 84 }],
                text: 'source text',
              },
            },
            {
              entity: 'targetId',
              template: 'relationTypeId',
              reference: {
                selectionRectangles: [{ top: 28, left: 12, height: 13, width: 84 }],
                text: 'target text',
              },
            },
          ],
        ],
      });

      actions.saveConnection(connection)(store.dispatch, getState);
      expect(api.post).toHaveBeenCalledWith('relationships/bulk', expectedParams);
    });

    it('should broadcast CONNECTION_CREATED, execute the callback and broadcast success', done => {
      const callback = jasmine.createSpy('callback');
      actions
        .saveConnection(connection, callback)(store.dispatch, getState)
        .then(() => {
          expect(store.getActions()).toContainEqual({ type: 'CONNECTION_CREATED' });
          expect(callback).toHaveBeenCalledWith('bulkResponse(ArrayOfTwo)');
          expect(store.getActions()).toContainEqual({
            type: notificationsTypes.NOTIFY,
            notification: { message: 'saved successfully !', type: 'success', id: 'unique_id' },
          });
          done();
        })
        .catch(done.fail);
    });
  });

  describe('selectRangedTarget', () => {
    it('should broadcast CREATING_RANGED_CONNECTION and execute callback with target id', () => {
      const callback = jasmine.createSpy('callback');
      actions.selectRangedTarget({ targetDocument: 'targetId' }, callback)(store.dispatch);
      expect(store.getActions()).toContainEqual({ type: 'CREATING_RANGED_CONNECTION' });
      expect(callback).toHaveBeenCalledWith('targetId');
    });
  });
});
