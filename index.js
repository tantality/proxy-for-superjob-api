const express = require("express");
const proxy = require("express-http-proxy");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({origin: true}));

app.use(
  "/",
  proxy(process.env.ORIGINAL_SERVER_URL, { https: true })
);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).send("Server error");
});

app.listen(port, () => {
  console.log("Server started");
});
