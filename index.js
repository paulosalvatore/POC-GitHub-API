require("dotenv").config();

const githubApiToken = process.env.GITHUB_API_TOKEN;

const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(process.env.PORT || 3000);
