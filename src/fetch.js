import 'isomorphic-fetch';
import {
  URLSearchParams as realURLSearchParams,
} from 'urlsearchparams';
import _ from 'lodash';

if (!global.URLSearchParams) {
  global.URLSearchParams = realURLSearchParams;
}

const { fetch, FormData, URLSearchParams } = global;

const CONTENTLESS_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];
const CSRF_HEADER_NAME = 'X-CSRFToken';

const fillForm = (namespace, params, form) => {
  const namespaceStr = _.reduce(
    _.tail(namespace),
    (nsStr, nsSlice) => `${nsStr}[${nsSlice}]`,
    _.head(namespace),
  );

  _.forOwn(params, (value, key) => {
    if (_.isArray(value) || _.isPlainObject(value)) {
      fillForm(_.concat(namespace, [key]), value, form);
    } else if (namespace.length > 0) {
      form.append(`${namespaceStr}[${key}]`, value);
    } else {
      form.append(key, value);
    }
  });

  return form;
};

export default (path, options = {}) => {
  const params = options.params || {};
  const method = options.method || 'GET';
  const fetchHeaders = { ...options.headers };
  const fetchOptions = {
    method,
    headers: fetchHeaders,
  };

  if (options.json) {
    fetchHeaders.Accept = 'application/json';
  }

  let url = path;

  if (CONTENTLESS_METHODS.includes(method)) {
    if (!_.isEmpty(params)) {
      url = `${url}?${fillForm([], params, new URLSearchParams()).toString()}`;
    }
  } else {
    if (options.json) {
      fetchHeaders['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(params);
    } else if (!_.isEmpty(params)) {
      fetchOptions.body = fillForm([], params, new FormData());
    }
    if (options.CSRFToken) {
      fetchHeaders[CSRF_HEADER_NAME] = options.CSRFToken;
    }
  }

  return fetch(url, fetchOptions)
    .then((response) => {
      if (response.ok) {
        if (options.json) {
          return response.json();
        }

        return response;
      }

      if (options.json) {
        return response.json().then(data => Promise.reject(data));
      }

      return Promise.reject(response);
    });
};
