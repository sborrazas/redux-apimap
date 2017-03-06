# Redux ApiMap

[![Build Status](https://travis-ci.org/sborrazas/redux-apimap.svg?branch=master)](https://travis-ci.org/sborrazas/redux-apimap)

Build your API wrapper to dispatch actions, by mapping every action an API
endpoint.

**Does not create actions or reducers**, instead it provides a simple API
wrapper built on top of the
[fetch API](https://developer.mozilla.org/en/docs/Web/API/Fetch_API), with some
additional options for ease of use (JSON wrapper, CSRF token handling, etc).

Requires [React](https://github.com/facebook/react) to render components.

## Install

```
npm install redux-apimap
```

## Examples

### Quickstart

1. Create the API object with all the endpoints and actions for each endpoint:
    ```js
    import { createApi } from 'redux-apimap';

    import store from './store'; // Redux store

    export default createApi(store, {
      users: {
        path: '/users',
        actions: {
          fetch: {
            types: [USERS_FETCH, USERS_FETCH_SUCCESS, USERS_FETCH_FAILURE],
          },
          create: {
            types: [USERS_CREATE, USERS_CREATE_SUCCESS, USERS_CREATE_FAILURE],
            method: 'POST', // Option, submit request as multipart
            multipart: true, // Option, submit request as multipart
          }
        }
      }
    }, { json: true, CSRFToken: 'a7136f333552c6d4' });
    ```

2. Make the API object visible through the ApiProvider:
    ```js
    import { ApiProvider } from 'redux-apimap';
    import { Provider } from 'react-redux';

    import api from './api';

    export default class AppWrapper extends React.PureComponent {
      render() {
        return (
          <Provider store={store}>
            <ApiProvider api={api}>
              <App />
            </ApiProvider>
          </ReduxProvider>
        );
      }
    }
    ```

3. Dispatch actions with the api throughout the app:
    ```js
    const UsersAddButton = ({ api }) => {
      return (
        <button
          onClick={(e) => {
            const name = prompt('Enter user name');
            api.users.create({ name })
              .then(() => alert('User created!'))
              .catch((error) => alert(error));
          }}
        >+ Add new</button>
      );
    };

    export default connectApi(UsersAddButton);
    ```

  **Note:** `redux-apimap` does not handle the application state or state
  changes with reducers, **it only does action dispatching**.

The dispatched actions have the following structure:
* `type` — The `PENDING`, `SUCCESS` or `FAILURE` type provided on the endpoint
  action specification.
* `params` — The parameters sent when calling the API endpoint action (e.g.
  `api.users.create(params)`).
* `url` — The URL in which the HTTP request was sent to.
* `data` — If the `json: true` option was specified, contains the response
  content. Otherwise, it contains the response itself provided by the
  [fetch API](https://developer.mozilla.org/en/docs/Web/API/Fetch_API). Only
  present on the `SUCCESS` and `FAILURE` actions.

Sample action set:
```js
// PENDING
{
  type: 'USER_UPDATE',
  params: { name: 'Officer Barbrady' },
  url: '/users/1'
}

// SUCCESS (when json: true)
{
  type: 'USER_UPDATE_SUCCESS',
  params: { name: 'Officer Barbrady' },
  url: '/users/1',
  data: {
    id: 1,
    name: 'Officer Barbrady'
  }
}

// FAILURE (when json: true)
{
  type: 'USER_UPDATE_FAILURE',
  params: { name: '' },
  url: '/users/1',
  data: {
    { name: 'too short' }
  }
}
```


### Full example

```js
import { Provider, createStore, connect } from 'react-redux';
import {
  createApi,
  ApiProvider,
  connectApi
} from 'redux-apimap';
import store from './store';

// Specify the API endpoints and each action that it allows.
const users = {
  path: '/users',
  actions: {
    fetch: {
      types: [USERS_FETCH, USERS_FETCH_SUCCESS, USERS_FETCH_FAILURE],
      // method: 'GET' // DEFAULT
    },
    create: {
      types: [USERS_CREATE, USERS_CREATE_SUCCESS, USERS_CREATE_FAILURE],
      method: 'POST', // Option, submit request with POST
      multipart: true, // Option, submit request as multipart
    }
  }
};

// Create the API with the previously defined endpoints and any configuration
// necessary.
const api = createApi(store, {
  users,
}, { json: true });

// Make the API visible for child components through the <Provider> component.
export default class AppWrapper extends React.PureComponent {
  render() {
    return (
      <Provider store={store}> // Redux provider
        <ApiProvider api={api}>
          <Users />
        </ApiProvider>
      </ReduxProvider>
    );
  }
}

class UsersList extends React.PureComponent {
  render() {
    const { api, users: { isLoading, data } } = this.props;
    const addUser = () => {
      api.users.create({
        name: prompt('Enter user name')
      })
    };

    return (
      <ul>
        {
          isLoading &&
            data.map((user) => {
              return (<li>{user.name}</li>);
            })
        }
        <li>
          <button onClick={addUser}>+ Add new</button>
        </li>
      </ul>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    users: state.users
  };
};

UsersList = connect( // Redux connect
  mapStateToProps
)(connectApi(UsersList)); // Api connect
```

## API

### `<ApiProvider api>`

The wrapper React component to allow child components access the API object.

#### Props

* `api` (required) — The [Redux ApiMap API object](#apimap-api).
* `children` — The React children components.

### createApi(store, endpoints, config)

#### Arguments

* `store` (required) — The
  [Redux Store](http://redux.js.org/docs/basics/Store.html).
* `endpoints` (required) — An object mapping all the API endpoints. Each
  endpoint has the following specification:
  * `url` (required) — The url of the endpoint. This allows interpolating
    parameters (e.g. `/users/:id/posts`).
  * `actions` (required) — The actions this endpoint allows. Each action has the
    following specification:
    * `types` (required) — An array of 3 values (`[PENDING, SUCCESS, FAILURE]`)
      specifying the types for when the API request is made, responds
      successfully and fails respectively.
    * Any additional configuration for this specific action. This configuration
      object has the same values as the `config` configuration from below.
* `config` (optional, default `{}`) — Configuration that is used for all
  actions. Specification:
  * `fetch` (optional, defaults to the
    [fetch API](https://developer.mozilla.org/en/docs/Web/API/Fetch_API)) — The
    function to use to perform the HTTP request.
  * `method` (optional, default `GET`) — The method of the HTTP request.
  * `multipart` (optional, default `false`) — If `true`, a multipart HTTP
    request will be sent (overrides `json` option).
  * `json` (optional, default `false`) — If true, a JSON-formatted HTTP request
    will be sent. This also sets the `Accept` header to `application/json`.
  * Any additional options that can be sent to the
    [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch)
    function.

### connectApi(Component)

Connect the React component to get the `api` prop.

#### Arguments

* `Component` (required) — The React component to connect to. Must be nested
  somewhere inside the `ApiProvider` component.

## Sample configurations

### Include CSRF header

```js
createApi(store, endpoints, {
  headers: {
    'X-CSRFToken': document.getElementsByName("csrf-token")[0].content,
  },
});
```

**Note:** `X-CSRF-Token` header is used for Flask/Django applications. Use
`X-CSRF-Token` for Rack applications.

## Authors

**Sebastián Borrazás**

* [sborrazas.com](http://sborrazas.com)

Inspired by [react-redux](https://github.com/reactjs/react-redux) and
[redux-rest](https://github.com/Kvoti/redux-rest).

## License

MIT
