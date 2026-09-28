export default (express, bodyParser, createReadStream, crypto, http) => {
  const app = express();
  const login = "1a0a5652-832d-4e96-8ec5-04908999cd35";

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,OPTIONS,DELETE",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "ngrok-skip-browser-warning,Content-Type,Accept,Access-Control-Allow-Headers",
    );

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    next();
  });

  app.use((req, res, next) => {
    if (req.path !== "/" && !req.path.endsWith("/")) {
      const queryIndex = req.url.indexOf("?");
      const query = queryIndex === -1 ? "" : req.url.substring(queryIndex);

      res.redirect(308, `${req.path}/${query}`);
      return;
    }

    next();
  });

  app.get("/login/", (req, res) => {
    res.type("text/plain; charset=utf-8");
    res.send(login);
  });

  app.get("/code/", (req, res) => {
    res.type("text/plain; charset=utf-8");

    const stream = createReadStream(import.meta.url.substring(7));

    stream.on("error", () => {
      if (!res.headersSent) {
        res
          .status(500)
          .type("text/plain; charset=utf-8")
          .send("Cannot read app.js");
      }
    });

    stream.pipe(res);
  });

  app.get("/sha1/:input/", (req, res) => {
    const value = crypto
      .createHash("sha1")
      .update(req.params.input)
      .digest("hex");

    res.type("text/plain; charset=utf-8");
    res.send(value);
  });

  const handleReq = (req, res) => {
    const addr = req.query.addr || req.body?.addr;

    if (typeof addr !== "string" || addr.length === 0) {
      res.status(400).type("text/plain; charset=utf-8").send("Missing addr");
      return;
    }

    try {
      http
        .get(addr, (remoteResponse) => {
          let content = "";

          remoteResponse.setEncoding("utf8");

          remoteResponse.on("data", (chunk) => {
            content += chunk;
          });

          remoteResponse.on("end", () => {
            res.type("text/plain; charset=utf-8").send(content);
          });
        })
        .on("error", () => {
          res
            .status(502)
            .type("text/plain; charset=utf-8")
            .send("Request failed");
        });
    } catch {
      res.status(400).type("text/plain; charset=utf-8").send("Invalid addr");
    }
  };

  app.get("/req/", handleReq);
  app.post("/req/", handleReq);

  app.all(/.*/, (req, res) => {
    res.type("text/plain; charset=utf-8");
    res.send(login);
  });

  return app;
};
