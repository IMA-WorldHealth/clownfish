const { auth } = require('express-openid-connect');

const config = {
  authRequired: false, // flip this to true in live version
  auth0Logout: true,
  secret: process.env.SALTY_HASH,
  baseURL: 'https://clownfish.ima-data.com',
  clientID: 'eQblKtlu7q5W8WH9HmkNWOsXPCdVFkeD',
  issuerBaseURL: 'https://corusinternational.eu.auth0.com',
  routes: {
    callback: '/dashboard',
  },
};

module.exports = auth(config);
