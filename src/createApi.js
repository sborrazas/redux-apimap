import invariant from 'invariant';
import _ from 'lodash';
import fetch from './fetch';

const interpolateParams = (rawUrl, params) => {
  const requestParams = _.clone(params);
  const url = rawUrl.replace(/:(\w+)/, (__, key) => {
    const val = requestParams[key];

    _.unset(requestParams, [key]);

    return val;
  });

  return { requestParams, url };
};

const createActions = (actions, endpointUrl, dispatch, initialOptions) =>
  _.mapValues(actions, (action) => {
    const {
      fetch: _fetch,
      path,
      types,
      ...options
    } = { ...initialOptions, ...action };
    let rawUrl = endpointUrl;

    if (path) {
      rawUrl = `${rawUrl}${path}`;
    }

    if (options.baseUrl) {
      rawUrl = `${options.baseUrl}${rawUrl}`;
    }

    invariant(
      _.isArray(types) && types.length >= 2,
      'Missing at least 2 `types` (PENDING and SUCCESS) in API action ' +
      'specification.');

    const [REQUEST_TYPE, SUCCESS_TYPE, FAIL_TYPE] = types;

    return (params = {}) => {
      const { url, requestParams } = interpolateParams(rawUrl, params);

      options.params = requestParams;

      const promise = _fetch(url, options)
        .then((data) => {
          dispatch({
            type: SUCCESS_TYPE,
            payload: {
              data,
              params,
              url,
            },
          });

          return data;
        })
        .catch((data) => {
          dispatch({
            type: FAIL_TYPE,
            payload: {
              data,
              params,
              url,
            },
          });

          throw data;
        });

      dispatch({
        type: REQUEST_TYPE,
        payload: {
          params,
          url,
        },
      });

      return promise;
    };
  });

export default (store, endpoints, initialOptions = {}) => {
  const options = {
    fetch,
    method: 'GET',
    multipart: false,
    ...initialOptions,
  };

  invariant(
    _.isFunction(options.fetch),
    '`fetch` option must be a function of 2 arguments (url, options).',
  );

  return _.mapValues(endpoints, ({ url, actions }, name) => {
    invariant(url, `Missing \`url\` option on \`${name}\` endpoint.`);
    invariant(actions, `Missing \`actions\` option on \`${name}\` endpoint.`);

    return createActions(actions, url, store.dispatch, options);
  });
};
