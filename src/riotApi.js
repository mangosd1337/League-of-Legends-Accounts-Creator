const { app } = window.require('electron').remote;
const { remote } = window.require('electron');
const cp = remote.require('child_process');
const path = remote.require('path');
// const process = remote.require('process');
const axios = require('axios');

const crlf = (text) => text.replace(/\r\n|\r(?!\n)|\n/g, '\n');

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const nodeAxios = (username, password, birth, email, region, token, randomProxy) =>
  new Promise((resolve) => {
    const currDir = app.getAppPath();
    const args = [username, password, birth, email, region, token, randomProxy];
    cp.execFile(path.join(currDir, 'src', `nodeRiotRequest.exe`), args, (error, stdout) => {
      // console.log(stdout);
      const result = JSON.parse(stdout);
      resolve(result);
    });
  });

const requestRiotSignup = async (accDataRequest) => {
  const {
    token,
    username,
    password,
    email,
    region,
    dateOfBirth,
    useProxy,
    proxyList,
  } = accDataRequest;
  const requestBody = {
    username,
    password,
    confirm_password: password,
    date_of_birth: dateOfBirth,
    email,
    tou_agree: true,
    newsletter: false,
    region,
    campaign: 'league_of_legends',
    locale: 'en',
    token: `Captcha ${token}`,
  };
  const apiUrl = 'https://signup-api.leagueoflegends.com/v1/accounts';
  const proxyListNormalized = crlf(proxyList).split('\n').filter(Boolean);
  if (useProxy) {
    const randomProxy = proxyListNormalized[getRandomInt(0, proxyListNormalized.length - 1)] || '';
    const response = await nodeAxios(
      username,
      password,
      dateOfBirth,
      email,
      region,
      token,
      randomProxy,
    );
    if (response?.status === 409 || response?.status === 200) {
      return { response, proxy: `[${randomProxy}]` };
    }
    const newRes = await requestRiotSignup(accDataRequest);
    return newRes;
  }
  const response = await axios
    .post(apiUrl, requestBody, { headers: { 'Content-Type': 'application/json' } })
    .catch((err) => err.response.data);

  return { response, proxy: '' };
};

export default requestRiotSignup;
