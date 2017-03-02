import React, { Children } from 'react';

class ApiProvider extends React.PureComponent {
  getChildContext() {
    const { api } = this.props;

    return { api };
  }
  render() {
    return Children.only(this.props.children);
  }
}

ApiProvider.childContextTypes = {
  api: React.PropTypes.objectOf(React.PropTypes.object.isRequired).isRequired,
};

ApiProvider.propTypes = {
  api: React.PropTypes.objectOf(React.PropTypes.object.isRequired).isRequired,
  children: React.PropTypes.element.isRequired,
};

export default ApiProvider;
