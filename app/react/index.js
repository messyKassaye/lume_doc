import React from 'react';
import ReactDOM from 'react-dom';

import { AppContainer } from 'react-hot-loader';

import App from './App';

import './App/sockets';

const render = Component => {
  ReactDOM.hydrate(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('root')
  );
};

render(App);

if (module.hot) {
  module.hot.accept('./App', () => {
    const nextApp = require('./App');
    render(nextApp);
  });
}
