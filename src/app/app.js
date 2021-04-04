const validator = require("express-openapi-validator");
const express = require("express");
const path = require("path");
const { sendMessageToQueue } = require("./aws");

const OPEN_API_SPEC_PATH = path.join(__dirname, "api.yml");
const SQS_QUEUE_URL =
  "http://localhost:4566/000000000000/request_handler_queue";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  validator.middleware({ apiSpec: OPEN_API_SPEC_PATH, validateRequests: true })
);

const spec = OPEN_API_SPEC_PATH;
app.use("/spec", express.static(spec));

app.use((err, _req, res, _next) => {
  res.status(err.status).json({
    message: err.message,
    errors: err.errors,
  });
});

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.post("/", (req, res) => {
  sendMessageToQueue(SQS_QUEUE_URL, req.query);
  res.send("SUCCESS");
});

module.exports = app;
