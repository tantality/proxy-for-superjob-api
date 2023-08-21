const express = require("express");
const proxy = require("express-http-proxy");
const cors = require("cors");
const requestIp = require("request-ip");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const cookiePerIP = new Map();

app.use(requestIp.mw());

app.use(cors({ origin: true }));

app.use(
  "/",
  proxy(process.env.ORIGINAL_SERVER_URL, {
    https: true,
    userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
      const key = userReq.clientIp;

      if (headers["set-cookie"]) {
        const newCookies = headers["set-cookie"].map((cookie) => {
          const [key, value] = cookie.split(";")[0].split("=");
          return { key, value };
        });

        const previousCookies = cookiePerIP.get(key) || [];
        const currentCookies = previousCookies.concat(newCookies);

        cookiePerIP.set(key, currentCookies);
      }

      return headers;
    },
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      const key = srcReq.clientIp;
      if (cookiePerIP.has(key)) {
        const cookies = cookiePerIP
          .get(key)
          .map((c) => `${c.key}=${c.value}`)
          .join(";");

        proxyReqOpts.headers["cookie"] = cookies;
      }

      return proxyReqOpts;
    },
  })
);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).send("Server error");
});

app.listen(port, () => {
  console.log("Server started");
});
