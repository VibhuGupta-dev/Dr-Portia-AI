import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root'));

root.render(
  <Auth0Provider
    domain="dev-hp4cz88cawewo3y2.us.auth0.com"
    clientId="v64PWIo1EqUOyzSJp7xRqG4lNCJrT86d"
    authorizationParams={{
      redirect_uri: window.location.origin
    }}
  >
    <App />
  </Auth0Provider>
);
