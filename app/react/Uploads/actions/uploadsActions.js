import superagent from 'superagent';

import { actions as basicActions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { selectSingleDocument, unselectAllDocuments } from 'app/Library/actions/libraryActions';
import * as metadata from 'app/Metadata';
import * as types from 'app/Uploads/actions/actionTypes';
import * as libraryTypes from 'app/Library/actions/actionTypes';
import uniqueID from 'shared/uniqueID';
import { RequestParams } from 'app/utils/RequestParams';

import { APIURL } from '../../config.js';
import api from '../../utils/api';

export function enterUploads() {
  return {
    type: types.ENTER_UPLOADS_SECTION,
  };
}

export function showImportPanel() {
  return dispatch => {
    dispatch(basicActions.set('showImportPanel', true));
  };
}

export function closeImportPanel() {
  return dispatch => {
    dispatch(basicActions.set('showImportPanel', false));
  };
}

export function closeImportProgress() {
  return dispatch => {
    dispatch(basicActions.set('importProgress', 0));
    dispatch(basicActions.set('importStart', false));
    dispatch(basicActions.set('importEnd', false));
    dispatch(basicActions.set('importError', {}));
  };
}

export function newEntity() {
  return async (dispatch, getState) => {
    const newEntityMetadata = { title: '', type: 'entity' };
    dispatch(
      metadata.actions.loadInReduxForm(
        'uploads.sidepanel.metadata',
        newEntityMetadata,
        getState().templates.toJS()
      )
    );
    await dispatch(selectSingleDocument(newEntityMetadata));
  };
}

export function createDocument(newDoc) {
  return dispatch =>
    api.post('documents', new RequestParams(newDoc)).then(response => {
      const doc = response.json;
      dispatch({ type: types.NEW_UPLOAD_DOCUMENT, doc: doc.sharedId });
      dispatch({ type: types.ELEMENT_CREATED, doc });
      return doc;
    });
}

export function importData([file], template) {
  return dispatch =>
    new Promise(resolve => {
      superagent
        .post(`${APIURL}import`)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .field('template', template)
        .attach('file', file, file.name)
        .on('progress', data => {
          dispatch(basicActions.set('importUploadProgress', Math.floor(data.percent)));
        })
        .on('response', response => {
          dispatch(basicActions.set('importUploadProgress', 0));
          resolve(response);
        })
        .end();
    });
}

export function upload(docId, file, endpoint = 'files/upload/document') {
  return async dispatch =>
    new Promise(resolve => {
      superagent
        .post(APIURL + endpoint)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .field('entity', docId)
        .attach('file', file, file.name)
        .on('progress', data => {
          dispatch({
            type: types.UPLOAD_PROGRESS,
            doc: docId,
            progress: Math.floor(data.percent),
          });
        })
        .on('response', response => {
          dispatch({ type: types.UPLOAD_COMPLETE, doc: docId, file: response.body });
          resolve(JSON.parse(response.text));
        })
        .end();
    });
}

export function publicSubmit(data, remote = false) {
  return dispatch =>
    new Promise(resolve => {
      const request = superagent
        .post(remote ? `${APIURL}remotepublic` : `${APIURL}public`)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .field('captcha', JSON.stringify(data.captcha));

      if (data.file) {
        request.attach('file', data.file);
      }

      if (data.attachments) {
        data.attachments.forEach((attachment, index) => {
          request.attach(`attachments[${index}]`, attachment);
        });
      }
      request.field(
        'entity',
        JSON.stringify({ title: data.title, template: data.template, metadata: data.metadata })
      );
      let completionResolve;
      let completionReject;
      const uploadCompletePromise = new Promise((_resolve, _reject) => {
        completionResolve = _resolve;
        completionReject = _reject;
      });
      request
        .on('progress', () => {
          resolve({ promise: uploadCompletePromise });
        })
        .on('response', response => {
          if (response.status === 200) {
            dispatch(notificationActions.notify('Success', 'success'));
            completionResolve(response);
            return;
          }
          if (response.status === 403) {
            dispatch(notificationActions.notify(response.body.error, 'danger'));
            completionReject(response);
            return;
          }
          completionReject(response);
          dispatch(notificationActions.notify('An error has ocurred', 'danger'));
        })
        .end();
    });
}

export function uploadCustom(file) {
  return dispatch => {
    const id = `customUpload_${uniqueID()}`;
    return upload(
      id,
      file,
      'files/upload/custom'
    )(dispatch).then(response => {
      dispatch(basicActions.push('customUploads', response));
    });
  };
}

export function deleteCustomUpload(_id) {
  return dispatch =>
    api.delete('files', new RequestParams({ _id })).then(response => {
      dispatch(basicActions.remove('customUploads', response.json[0]));
    });
}

export function uploadDocument(docId, file) {
  return async dispatch => upload(docId, file)(dispatch);
}

export function documentProcessed(sharedId, __reducerKey) {
  return dispatch => {
    api.get('entities', new RequestParams({ sharedId })).then(response => {
      const doc = response.json.rows[0];
      dispatch({ type: libraryTypes.UPDATE_DOCUMENT, doc, __reducerKey });
      dispatch({ type: libraryTypes.UNSELECT_ALL_DOCUMENTS, __reducerKey });
      dispatch({ type: libraryTypes.SELECT_DOCUMENT, doc, __reducerKey });
      dispatch(basicActions.update('entityView/entity', doc));
      dispatch(basicActions.update('viewer/doc', doc));
    });
  };
}

export function documentProcessError(sharedId) {
  return { type: types.DOCUMENT_PROCESS_ERROR, sharedId };
}

export function publishEntity(entity) {
  return async dispatch => {
    const response = await api.post('entities', new RequestParams({ ...entity, published: true }));
    dispatch(notificationActions.notify('Entity published', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc: entity });
    dispatch(basicActions.set('entityView/entity', response.json));
    await dispatch(unselectAllDocuments());
  };
}

export function publishDocument(doc) {
  return async dispatch => {
    const response = await api.post('documents', new RequestParams({ ...doc, published: true }));
    dispatch(notificationActions.notify('Document published', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc });
    dispatch(basicActions.set('viewer/doc', response.json));
    await dispatch(unselectAllDocuments());
  };
}

export function unpublishEntity(entity) {
  return async dispatch => {
    const response = await api.post(
      'entities',
      new RequestParams({ _id: entity._id, sharedId: entity.sharedId, published: false })
    );
    dispatch(notificationActions.notify('Entity unpublished', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc: entity });
    dispatch(basicActions.set('entityView/entity', response.json));
    await dispatch(unselectAllDocuments());
  };
}

export function unpublishDocument(doc) {
  return async dispatch => {
    const response = await api.post(
      'documents',
      new RequestParams({ _id: doc._id, sharedId: doc.sharedId, published: false })
    );
    dispatch(notificationActions.notify('Document unpublished', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc });
    dispatch(basicActions.set('viewer/doc', response.json));
    await dispatch(unselectAllDocuments());
  };
}

export function publish(entity) {
  return dispatch =>
    !entity.file ? dispatch(publishEntity(entity)) : dispatch(publishDocument(entity));
}

export function unpublish(entity) {
  return dispatch =>
    !entity.file ? dispatch(unpublishEntity(entity)) : dispatch(unpublishDocument(entity));
}

export function conversionComplete(docId) {
  return {
    type: types.CONVERSION_COMPLETE,
    doc: docId,
  };
}
