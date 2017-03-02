import test from 'ava';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import spy from 'spy';

import './setupDom';
import createApi from '../src/createApi';
import ApiProvider from '../src/ApiProvider';

const api = createApi({}, {});

test('Enforce rendering a single child', (t) => {
  const cns = spy(console, 'error');
  cns.mock();

  t.notThrows(() => {
    TestUtils.renderIntoDocument(
      <ApiProvider api={api}>
        <div />
      </ApiProvider>,
    );
  });

  t.is(cns.calls.length, 0);
  cns.reset();
  cns.mock();

  t.throws(() => {
    TestUtils.renderIntoDocument(
      <ApiProvider api={api}>
        <div />
      </ApiProvider>,
    );
    TestUtils.renderIntoDocument(<ApiProvider api={api} />);
  });

  t.is(cns.calls.length, 1);
  cns.reset();
  cns.mock();

  t.throws(() => {
    TestUtils.renderIntoDocument(
      <ApiProvider api={api}>
        <div />
        <div />
      </ApiProvider>,
    );
  });

  t.is(cns.calls.length, 1);
  cns.restore();
});
