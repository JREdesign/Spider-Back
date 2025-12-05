// tokenStore.js
let currentToken = '';

export const setToken = (token) => {
  currentToken = token;
};

export const getToken = () => currentToken;
