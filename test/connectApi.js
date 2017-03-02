import test from 'ava';
import React from 'react';
import TestUtils from 'react-addons-test-utils';

import './setupDom';
import createApi from '../src/createApi';
import ApiProvider from '../src/ApiProvider';
import connectApi from '../src/connectApi';

const api = createApi({}, {});
const wrap = (Component, text) => {
  const Wrapped = connectApi(Component);

  return (<ApiProvider api={api}><Wrapped text={text} /></ApiProvider>);
};

class Custom extends React.PureComponent {
  render() {
    const { text } = this.props;

    return (<div>{text}</div>);
  }
}

Custom.propTypes = {
  text: React.PropTypes.string.isRequired,
};

test('Access the api through a ApiProvider parent', (t) => {
  const text = 'some text';
  const tree = TestUtils.renderIntoDocument(wrap(Custom, text));
  const stub = TestUtils.findRenderedComponentWithType(tree, Custom);

  t.is(stub.props.api, api);
  t.is(stub.props.text, text);
});
