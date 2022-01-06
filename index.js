// DotEnv
require('dotenv').config();

// Auth
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');

// Axios
const axios = require('axios');

// Express
const express = require('express');

// Auth

const privateKeyBase64 = Buffer.from(process.env.GITHUB_PEM, 'base64');
const privateKey = privateKeyBase64.toString('ascii');

const pubKeyObject = crypto.createPublicKey({
    key: privateKey,
    format: 'pem',
});

const publicKey = pubKeyObject.export({
    format: 'pem',
    type: 'spki',
});

const appId = '162974';
const clientId = 'Iv1.e643fd1328e57814';

const issuer = appId;
const subject = 'salvatoregames@gmail.com';
const audience = 'https://poc-github-api.herokuapp.com/';
const expiresIn = '10m';
const algorithm = 'RS256';

const signOptions = {
    issuer,
    subject,
    audience,
    expiresIn,
    algorithm,
};

const payload = {};

const tokenFromPem = jwt.sign(payload, privateKey, signOptions);

// console.log({ tokenFromPem });

const verifyOptions = {
    issuer,
    subject,
    audience,
    expiresIn,
    algorithm,
};

const legit = jwt.verify(tokenFromPem, publicKey, verifyOptions);

// console.log({ legit });

const githubApiToken = process.env.GITHUB_API_TOKEN;

// GitHub API

axios
    .get('https://api.github.com/app', {
        headers: {
            Authorization: `Bearer ${tokenFromPem}`,
            Accept: 'application/vnd.github.v3+json',
        },
    })
    .then(response => {
        console.log('Successfully authenticated with GitHub API');
        // console.log(response.data);
    })
    .catch(error => {
        console.error(error.message);
    });

// Express App

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/login', (req, res) => {
    const url = new URL('https://github.com/login/oauth/authorize');

    url.searchParams.append('client_id', clientId);
    url.searchParams.append(
        'redirect_uri',
        'https://poc-github-api.herokuapp.com/callback-url',
    );
    url.searchParams.append('state', 'random_string');
    url.searchParams.append('login', 'bluemer-test');
    // url.searchParams.append("login", "salvatoregames@gmail.com");

    res.send(`<a href="${url}">Login</a>`);
});

app.get('/callback-url', (req, res) => {
    const code = req.query.code;
    const state = req.query.state;

    const accessTokenUrl = new URL(
        'https://github.com/login/oauth/access_token',
    );

    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    accessTokenUrl.searchParams.append('client_id', clientId);
    accessTokenUrl.searchParams.append('client_secret', clientSecret);
    accessTokenUrl.searchParams.append('code', code);
    accessTokenUrl.searchParams.append(
        'redirect_uri',
        'https://poc-github-api.herokuapp.com/callback-url',
    );
    accessTokenUrl.searchParams.append('state', state);

    axios
        .post(accessTokenUrl.toString())
        .then(response => {
            // const accessToken = response.data.access_token;
            // const tokenType = response.data.token_type;

            // const userUrl = new URL('https://api.github.com/user');

            // userUrl.searchParams.append('access_token', accessToken);
            // userUrl.searchParams.append('token_type', tokenType);

            // axios.get(userUrl).then(response => {
            //     console.log(response.data);
            //     res.send(response.data);
            // });

            res.send({
                data: response.data,
            });
        })
        .catch(error => {
            console.error(error.message);

            res.send(error.message);
        });
});

app.listen(process.env.PORT || 3000);
