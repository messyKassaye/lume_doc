import { actions as formActions } from 'react-redux-form';
import superagent from 'superagent';

import { APIURL } from 'app/config.js';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { updateEntity, selectSingleDocument } from 'app/Library/actions/libraryActions';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { actions as basicReducerActions } from 'app/BasicReducer';

import * as types from './actionTypes';

export function updateFile(file, entity) {
  return async dispatch => {
    await api.post('files', new RequestParams(file));
    const documents = entity.documents.map(f => {
      if (f._id === file._id) {
        return file;
      }
      return f;
    });
    const updatedEntity = Object.assign(entity, { documents });
    dispatch(basicReducerActions.set('viewer/doc', updatedEntity));
    dispatch(updateEntity(updatedEntity));
    await dispatch(selectSingleDocument(updatedEntity));
    dispatch(notify('File updated', 'success'));
  };
}

export function deleteFile(file, entity) {
  return async dispatch => {
    await api.delete('files', new RequestParams({ _id: file._id }));
    const documents = entity.documents.filter(f => f._id !== file._id);

    const updatedEntity = Object.assign(entity, { documents });
    dispatch(basicReducerActions.set('viewer/doc', updatedEntity));
    dispatch(updateEntity(updatedEntity));
    await dispatch(selectSingleDocument(updatedEntity));
    dispatch(notify('File deleted', 'success'));
  };
}

export function uploadAttachment(entity, file, __reducerKey) {
  return dispatch => {
    dispatch({ type: types.START_UPLOAD_ATTACHMENT, entity });
    superagent
      .post(`${APIURL}files/upload/attachment`)
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .field('entity', entity)
      .attach('file', file, file.name)
      .on('progress', data => {
        dispatch({ type: types.ATTACHMENT_PROGRESS, entity, progress: Math.floor(data.percent) });
      })
      .on('response', result => {
        dispatch({
          type: types.ATTACHMENT_COMPLETE,
          entity,
          file: JSON.parse(result.text),
          __reducerKey,
        });
      })
      .end();
  };
}

export function uploadAttachmentFromUrl(entity, name, url, __reducerKey) {
  return dispatch => {
    dispatch({ type: types.START_UPLOAD_ATTACHMENT, entity });
    api
      .post('files', new RequestParams({ originalname: name, url, entity, type: 'attachment' }))
      .then(newFile => {
        dispatch({ type: types.ATTACHMENT_COMPLETE, entity, file: newFile.json, __reducerKey });
        dispatch(notify('Attachment uploaded', 'success'));
      });
  };
}

export function renameAttachment(entityId, form, __reducerKey, file) {
  return dispatch =>
    api
      .post(
        'files',
        new RequestParams({
          _id: file._id,
          originalname: file.originalname,
        })
      )
      .then(renamedFile => {
        dispatch({
          type: types.ATTACHMENT_RENAMED,
          entity: entityId,
          file: renamedFile.json,
          __reducerKey,
        });
        dispatch(formActions.reset(form));
        dispatch(notify('Attachment renamed', 'success'));
      });
}

export function deleteAttachment(entitySharedId, attachment, __reducerKey) {
  return async dispatch => {
    await api.delete(
      'files',
      new RequestParams({
        _id: attachment._id,
      })
    );
    dispatch({
      type: types.ATTACHMENT_DELETED,
      entity: entitySharedId,
      file: attachment,
      __reducerKey,
    });

    dispatch(notify('Attachment deleted', 'success'));
  };
}

export function loadForm(form, attachment) {
  return dispatch => {
    dispatch(formActions.reset(form));
    dispatch(formActions.load(form, attachment));
  };
}

export function submitForm(form) {
  return dispatch => {
    dispatch(formActions.submit(form));
  };
}

export function resetForm(form) {
  return dispatch => {
    dispatch(formActions.reset(form));
  };
}
