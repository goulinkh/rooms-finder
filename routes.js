const router = (exports.router = require("express").Router());
router.get("/", (_, res) => res.send("yo"));
