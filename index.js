// DotEnv
require("dotenv").config();

// Auth
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");

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

const issuer = "Issuer";
const subject = "Subject";
const audience = "audience";

const signOptions = {
    issuer,
    subject,
    audience,
    expiresIn: "12h",
    algorithm: "RS256",
};

const payload = { data: "some data" };

const tokenFromPem = jwt.sign(payload, privateKey, signOptions);

console.log({ tokenFromPem });

const verifyOptions = {
    issuer,
    subject,
    audience,
    expiresIn: "12h",
    algorithm: ["RS256"],
};

const legit = jwt.verify(tokenFromPem, publicKey, verifyOptions);

console.log({ legit });

const githubApiToken = process.env.GITHUB_API_TOKEN;

// Express App

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(process.env.PORT || 3000);
