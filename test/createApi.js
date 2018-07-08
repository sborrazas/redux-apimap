import test from 'ava';
import _ from 'lodash';
import nock from 'nock';

import { createApi } from '../src';

const FETCH_PENDING = 'FETCH_PENDING';
const FETCH_SUCCESS = 'FETCH_SUCCESS';
const FETCH_FAILURE = 'FETCH_FAILURE';
const GENERIC_PENDING = 'GENERIC_PENDING';
const GENERIC_SUCCESS = 'GENERIC_SUCCESS';
const GENERIC_FAILURE = 'GENERIC_FAILURE';

const baseUrl = 'http://test.com';

const users = {
  path: '/users',
  actions: {
    fetch: {
      types: [FETCH_PENDING, FETCH_SUCCESS, FETCH_FAILURE],
    },
    create: {
      method: 'POST',
      multipart: true,
      types: [GENERIC_PENDING, GENERIC_SUCCESS, GENERIC_FAILURE],
    },
  },
};

const user = {
  path: '/user/:id',
  actions: {
    update: {
      method: 'PUT',
      types: [GENERIC_PENDING, GENERIC_SUCCESS, GENERIC_FAILURE],
    },
    disable: {
      path: '/disable',
      method: 'POST',
      types: [GENERIC_PENDING, GENERIC_SUCCESS, GENERIC_FAILURE],
    },
  },
};

const apiEndpoints = {
  users,
  user,
};

const emptyFun = () => {};

const createMockApi = (endpoints, options = {}, dispatch = emptyFun) =>
  createApi({ dispatch }, endpoints, _.extend({ json: true }, options));

const createUsersApi = (options = {}, dispatch = emptyFun) =>
  createMockApi(apiEndpoints, _.extend({ baseUrl }, options), dispatch);

test.afterEach(() => {
  nock.cleanAll();
});

test('Validates `fetch` option', (t) => {
  t.throws(() => {
    createUsersApi({ fetch: 'wrong' });
  });
});

test('Validates `type` on every action', (t) => {
  t.throws(() => {
    createMockApi({
      missingTypesEndpoint: {
        path: '/missing-types-endpoint',
        actions: {
          fetch: {},
        },
      },
    });
  });
});

test('Validates `path` on every action', (t) => {
  t.throws(() => {
    createMockApi({
      missingPathEndpoint: {
        actions: {
          fetch: {},
        },
      },
    });
  });
});

test('Validates `actions` on every endpoint', (t) => {
  t.throws(() => {
    createMockApi({
      missingUrlEndpoint: {
        url: '/missing-action-endpoint',
      },
    });
  });
});

test('Creates every endpoint on the api object', (t) => {
  const api = createUsersApi();

  _.forEach(apiEndpoints, (__, endpointName) => {
    t.truthy(api[endpointName]);
  });
});

test('Creates every action on every endpoint on the api object', (t) => {
  const api = createUsersApi();

  _.forEach(apiEndpoints, (endpoint, endpointName) => {
    _.forEach(endpoint.actions, (__, actionName) => {
      t.truthy(api[endpointName][actionName]);
    });
  });
});

test.cb('API triggers an API request through the default fetch', (t) => {
  const content = [{ name: 'U1' }];

  t.plan(1);

  nock(baseUrl)
    .get('/users')
    .reply(200, content);

  const api = createUsersApi({});

  api.users.fetch().then((result) => {
    t.deepEqual(result, content);
    t.end();
  });
});

test.cb('API triggers an API request with interpolation & custom action path', (t) => {
  const content = { name: 'U1' };

  t.plan(1);

  nock(baseUrl)
    .post('/user/1/disable')
    .reply(200, content);

  const api = createUsersApi({});

  api.user.disable({ id: 1 }).then((result) => {
    t.deepEqual(result, content);
    t.end();
  });
});

test.cb('API triggers an API request through a custom fetch', (t) => {
  const content = [{ name: 'U1' }];
  const fetch = (url, options) => {
    t.is(url, `${baseUrl}/users`);
    t.true(_.isEmpty(options.params));

    return Promise.resolve(content);
  };

  t.plan(3);

  const api = createUsersApi({ fetch });

  api.users.fetch()
    .then((result) => {
      t.deepEqual(result, content);
      t.end();
    })
    .catch(() => {
      t.end();
    });
});

test.cb('API dispatches an PENDING & SUCCESS', (t) => {
  const content = [{ name: 'U1' }];

  t.plan(2);

  nock(baseUrl)
    .get('/users')
    .reply(200, content);

  const api = createUsersApi({}, ({ type, payload }) => {
    if (type === FETCH_PENDING) {
      t.pass();
    } else if (type === FETCH_SUCCESS) {
      t.deepEqual(content, payload.data);
    } else {
      t.fail();
    }
  });

  api.users.fetch()
    .then(() => {
      t.end();
    })
    .catch(() => {
      t.end();
    });
});

test.cb('API dispatches an PENDING & FAILURE', (t) => {
  const content = [{ name: 'U1' }];

  t.plan(2);

  nock(baseUrl)
    .get('/users')
    .reply(404, content);

  const api = createUsersApi({}, ({ type, payload }) => {
    if (type === FETCH_PENDING) {
      t.pass();
    } else if (type === FETCH_FAILURE) {
      t.deepEqual(content, payload.data);
    } else {
      t.fail();
    }
  });

  api.users.fetch()
    .then(() => {
      t.end();
    })
    .catch(() => {
      t.end();
    });
});
