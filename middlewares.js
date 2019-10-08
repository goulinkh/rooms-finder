const yn = require("yn");

const cors = require("cors");
const helmet = require("helmet");
const express = require("express");

function errorsHandler(err, _req, res, _next) {
  if (yn(process.env.DEGUB)) {
    console.log("Request errors handler: ");
    console.log(err);
  }
  if (err && !res.headersSent) {
    if (err.message && err.message.match(/^\[custom\]/gi)) {
      res
        .status(404)
        .json({ message: err.message.replace(/^\[custom\]/gi, "") });
    } else {
      res.status(404).send({ message: "Requête invalide" });
    }
  }
}

module.exports = {
  pre: [cors(), helmet({ xssFilter: false })],
  post: [errorsHandler]
};
