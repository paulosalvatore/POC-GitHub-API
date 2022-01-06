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
            const accessToken = response.data.access_token;
            const tokenType = response.data.token_type;

            res.send({
                data: response.data,
                accessToken,
                tokenType,
            });
        })
        .catch(error => {
            console.error(error.message);

            res.send(error.message);
        });
});

// Tests with User Data

const userTokenRawData =
    'access_token=ghu_9X1fslzEm6EVieyzQ9HFEMaqhNRblR1VoNBH&expires_in=28800&refresh_token=ghr_gJDH8YXBOXEEVzzL61zb5Wgiwsr7Mb1zYDLoGqDd5PKPNmOW45Ty03nrFdkd538helrtmc4XYVfn&refresh_token_expires_in=15638400&scope=&token_type=bearer';

const userTokenData = userTokenRawData.split('&').reduce(
    (acc, curr) => {
        const [key, value] = curr.split('=');

        acc[key] = value;

        return acc;
    },
    {
        access_token: undefined,
        token_type: undefined,
    },
);

// const userUrl = new URL('https://api.github.com/users/bluemer-test/orgs');
const userUrl = new URL('https://api.github.com/user/orgs');

// const accessToken = userTokenData.access_token;
const accessToken = githubApiToken;

const tokenType = userTokenData.token_type;

// userUrl.searchParams.append('access_token', accessToken);
// userUrl.searchParams.append('token_type', tokenType);
// (async () => {
//     try {
//         const response = await axios.get(userUrl.toString(), {
//             headers: {
//                 Authorization: `${tokenType} ${accessToken}`,
//             },
//         });
//
//         console.log(response.data);
//     } catch (error) {
//         console.error(error.message);
//     }
// })();

const BASE_URL = 'https://api.github.com';

const org = 'blue-edtech-team';
const team_slug = 'bluemers';
const username = 'bluemer-test';

const membershipUrl = new URL(
    `${BASE_URL}/orgs/${org}/teams/${team_slug}/memberships/${username}`,
);

(async () => {
    try {
        console.log({ membershipUrl: membershipUrl.toString() });

        const response = await axios.put(
            membershipUrl.toString(),
            {
                role: 'member',
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                    ContentType: 'application/json',
                },
            },
        );

        console.log(response.data);
    } catch (error) {
        console.error(
            'Error updating membership:',
            error.message,
            error.response.data,
        );
    }
})();

// TODO: Maybe we need to receive a WebHook from GitHub to know when the membership is updated
// TODO: After that, we need to add the user to the team according to user's class (aka M1-LAP)

app.listen(process.env.PORT || 3000);
