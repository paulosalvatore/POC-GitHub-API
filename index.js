// DotEnv
require("dotenv").config();

// Auth
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");

// Axios
const axios = require("axios");

// Express
const express = require("express");

// Auth

const privateKey = fs.readFileSync("./pem/private-key.pem");

const pubKeyObject = crypto.createPublicKey({
    key: privateKey,
    format: "pem",
});

const publicKey = pubKeyObject.export({
    format: "pem",
    type: "spki",
});

const issuer = "162974";
const subject = "salvatoregames@gmail.com";
const audience = "https://poc-github-api.herokuapp.com/";
const expiresIn = "10m";
const algorithm = "RS256";

const signOptions = {
    issuer,
    subject,
    audience,
    expiresIn,
    algorithm,
};

const payload = {};

const tokenFromPem = jwt.sign(payload, privateKey, signOptions);

console.log({ tokenFromPem });

const verifyOptions = {
    issuer,
    subject,
    audience,
    expiresIn,
    algorithm,
};

const legit = jwt.verify(tokenFromPem, publicKey, verifyOptions);

console.log({ legit });

const githubApiToken = process.env.GITHUB_API_TOKEN;

// GitHub API

axios.get("https://api.github.com/app", {
    headers: {
        Authorization: `Bearer ${tokenFromPem}`,
        Accept: "application/vnd.github.v3+json",
    },
}).then((response) => {
    console.log(response.data);
}).catch((error) => {
    console.error(error.message);
});

// Express App

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/login", (req, res) => {
  const url = new URL(`https://github.com/login/oauth/authorize`);

  url.searchParams.append("client_id", clientId);
  url.searchParams.append(
    "redirect_uri",
    "https://poc-github-api.herokuapp.com/callback-url"
  );
  url.searchParams.append("state", "random_string");
  url.searchParams.append("login", "dikiwov360");
  // url.searchParams.append("login", "salvatoregames@gmail.com");

  res.send(`<a href="${url}">Login</a>`);
});

app.get("/callback-url", (req, res) => {
  console.log("Callback URL");
});

app.listen(process.env.PORT || 3000);
