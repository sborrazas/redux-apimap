import React from 'react';

export default (Component) => {
  const ApiComponent = (props, context) => {
    const { api } = context;

    return React.createElement(Component, { ...props, api });
  };

  ApiComponent.contextTypes = {
    api: React.PropTypes.objectOf(React.PropTypes.object.isRequired).isRequired,
  };

  ApiComponent.displayName = `ConnectApi(${
    Component.displayName || Component.name || 'Component'
  })`;

  return ApiComponent;
};
