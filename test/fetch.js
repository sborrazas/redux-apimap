import test from 'ava';
import _ from 'lodash';
import nock from 'nock';
import spy from 'spy';

import fetch from '../src/fetch';

test.afterEach(() => {
  nock.cleanAll();
});

const BASE_URL = 'http://test.com';
const TEST_CONTENT = { users: [{ name: 'u1' }] };

const performRequest = (t, url, params, options = {}) =>
  fetch(`${BASE_URL}${url}`, _.extend({ params, json: true }, options))
    .catch((err) => {
      t.fail(err.toString());
      t.end();
    });

test('Encodes JSON response', (t) => {
  nock(BASE_URL)
    .get('/users')
    .reply(200, TEST_CONTENT);

  t.plan(1);

  return performRequest(t, '/users').then((result) => {
    t.deepEqual(result, TEST_CONTENT);
  });
});

test('Encodes query string parameters on GET requests', (t) => {
  const params = { p1: 'a' };

  nock(BASE_URL)
    .get('/users?p1=a')
    .reply(200, TEST_CONTENT);

  t.plan(1);

  return performRequest(t, '/users', params).then((result) => {
    t.deepEqual(result, TEST_CONTENT);
  });
});

test('Encodes nested query string parameters on GET requests', (t) => {
  const params = { a: { b: { c: 1 } } };

  nock(BASE_URL)
    .get('/users?a%5Bb%5D%5Bc%5D=1')
    .reply(200, TEST_CONTENT);

  t.plan(1);

  return performRequest(t, '/users', params).then((result) => {
    t.deepEqual(result, TEST_CONTENT);
  });
});

test('Encodes nested query string parameters on multipart requests', (t) => {
  const params = { a: { b: { c: 1 } } };
  const expectedResult = { x: 1 };
  const path = '/encode-multipart';

  nock(BASE_URL)
    .post(path)
    .reply(200, (uri, requestBody) => {
      t.regex(requestBody, /a\[b\]\[c\]/);
      t.regex(requestBody, new RegExp(/^\s*1$/, 'm'));

      return expectedResult;
    });

  t.plan(3);

  return performRequest(t, path, params, { method: 'POST', multipart: true })
    .then((result) => {
      t.deepEqual(result, expectedResult);
    });
});

test('Encodes JSON requests', (t) => {
  const params = { a: { b: { c: 1 } } };
  const path = '/encode-json-req';

  t.plan(1);

  nock(BASE_URL)
    .post(path)
    .reply(200, (uri, requestBody) => requestBody);

  return performRequest(t, path, params, { method: 'POST' })
    .then((result) => {
      t.deepEqual(result, params);
    });
});

test('Sends additional headers when specified', (t) => {
  const CSRFToken = 'b460bdf7fc59f957b1d6e31697131264';
  const headers = { 'X-CSRFToken': CSRFToken };

  nock(BASE_URL)
    .post('/users')
    .matchHeader('X-CSRFToken', CSRFToken)
    .reply(200, TEST_CONTENT);

  t.plan(1);

  return performRequest(t, '/users', {}, { method: 'POST', headers })
    .then((result) => {
      t.deepEqual(result, TEST_CONTENT);
    });
});

test('Sends additional options when specified', (t) => {
  const cns = spy(global, 'fetch');
  cns.mock((url, options) => {
    t.is(options.credentials, 'same-origin');

    return cns.method(url, options);
  });
  nock(BASE_URL)
    .get('/users')
    .reply(200, {});

  t.plan(1);

  return performRequest(t, '/users', {}, { credentials: 'same-origin' })
    .then(() => {
      cns.restore();
    });
});
