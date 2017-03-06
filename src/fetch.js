import 'isomorphic-fetch';
import 'isomorphic-form-data';
import { stringify } from 'mini-querystring';
import _ from 'lodash';

const CONTENTLESS_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];

const fillForm = (namespace, params, form = new global.FormData()) => {
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
  const {
    method = 'GET',
    params = {},
    headers = {},
    ...fetchOptions
  } = options;

  fetchOptions.method = method;
  fetchOptions.headers = headers;

  if (options.json) {
    headers.Accept = 'application/json';
  }

  let url = path;

  if (_.includes(CONTENTLESS_METHODS, method)) {
    if (!_.isEmpty(params)) {
      url = `${url}?${stringify(params, true)}`;
    }
  } else if (options.json) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(params);
  } else if (!_.isEmpty(params)) {
    fetchOptions.body = fillForm([], params);
  }

  return global.fetch(url, fetchOptions)
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
