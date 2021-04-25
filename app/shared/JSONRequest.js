import 'isomorphic-fetch';
import superagent from 'superagent';
import { URLSearchParams } from 'url';

import rison from 'rison-node';

let cookie;

const attemptRisonDecode = string => {
  const errcb = e => {
    throw Error(`rison decoder error: ${e}`);
  };

  const risonParser = new rison.parser(errcb); // eslint-disable-line new-cap
  risonParser.error = message => {
    this.message = message;
  };

  risonParser.parse(string);
};

export function toUrlParams(_data) {
  const data = { ..._data };
  if (!data || Object.keys(data).length === 0) {
    return '';
  }

  return `?${Object.keys(data)
    .map(key => {
      if (typeof data[key] === 'undefined' || data[key] === null) {
        return;
      }

      if (typeof data[key] === 'object') {
        data[key] = JSON.stringify(data[key]);
      }

      let encodedValue = encodeURIComponent(data[key]);

      if (encodeURIComponent(key) === 'q') {
        try {
          attemptRisonDecode(data[key]);
          encodedValue = data[key];
        } catch (err) {
          encodedValue = encodeURIComponent(data[key]);
        }
      }
      return `${encodeURIComponent(key)}=${encodedValue}`;
    })
    .filter(param => param)
    .join('&')}`;
}

const _fetch = (url, data, method, _headers) => {
  let response;
  let params = '';
  let body;

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    Cookie: cookie,
    ..._headers,
  };

  if (method === 'GET' || method === 'DELETE') {
    params = toUrlParams(data);
  }

  if (method === 'POST' || method === 'PUT') {
    body = JSON.stringify(data);
  }

  if (URLSearchParams && data instanceof URLSearchParams) {
    body = data;
  }

  return fetch(url + params, {
    method,
    headers,
    credentials: 'same-origin',
    body,
  })
    .then(res => {
      let setCookie;
      if (res.headers.get('set-cookie')) {
        setCookie = res.headers.get('set-cookie');
      }
      response = res;
      // Failed .json() parsing usually indicates a non-success http status,
      // so we rather return that failure status than throw our own parsin
      // error.
      return Promise.all([res.json().catch(() => ({})), setCookie, res.headers]);
    })
    .then(([json, setCookie, responseHeaders]) => {
      const processedResponse = {
        json,
        status: response.status,
        cookie: setCookie,
        headers: responseHeaders,
      };

      if (response.status > 399) {
        throw processedResponse;
      }

      return processedResponse;
    });
};

export default {
  post: (url, data, headers) => _fetch(url, data, 'POST', headers),

  put: (url, data, headers) => _fetch(url, data, 'PUT', headers),

  get: (url, data, headers) => _fetch(url, data, 'GET', headers),

  delete: (url, data, headers) => _fetch(url, data, 'DELETE', headers),

  head: (url, data, headers) => _fetch(url, data, 'HEAD', headers),

  // TEST!!!! Fully untested function
  uploadFile: (url, filename, file, _cookie) =>
    new Promise((resolve, reject) => {
      superagent
        .post(url)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', _cookie || cookie || '')
        .attach('file', file, filename)
        .then(response => {
          resolve(response);
        })
        .catch(err => {
          reject(err);
        });
    }),

  cookie: c => {
    cookie = c;
  },
};
