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
      res.status(200).type("text/plain; charset=utf-8").send("");
      return;
    }

    next();
  });

  app.use((req, res, next) => {
    if (req.path !== "/" && !req.path.endsWith("/")) {
      const questionMark = req.url.indexOf("?");
      const search = questionMark === -1 ? "" : req.url.substring(questionMark);

      res.redirect(308, `${req.path}/${search}`);
      return;
    }

    next();
  });

  app.get("/login", (req, res) => {
    res.type("text/plain; charset=utf-8");
    res.send(login);
  });

  app.get("/code", (req, res) => {
    res.type("text/plain; charset=utf-8");

    const source = createReadStream(import.meta.url.substring(7));

    source.on("error", () => {
      if (!res.headersSent) {
        res
          .status(500)
          .type("text/plain; charset=utf-8")
          .send("Cannot read app.js");
      }
    });

    source.pipe(res);
  });

  app.get("/sha1/:input", (req, res) => {
    res.type("text/plain; charset=utf-8");
    res.send(crypto.createHash("sha1").update(req.params.input).digest("hex"));
  });

  const getResource = (req, res) => {
    const addr = req.query.addr || req.body?.addr;

    if (typeof addr !== "string" || addr.length === 0) {
      res.status(400).type("text/plain; charset=utf-8").send("Missing addr");
      return;
    }

    try {
      http
        .get(addr, (remoteResponse) => {
          let text = "";

          remoteResponse.setEncoding("utf8");

          remoteResponse.on("data", (chunk) => {
            text += chunk;
          });

          remoteResponse.on("end", () => {
            res.type("text/plain; charset=utf-8").send(text);
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

  app.get("/req", getResource);
  app.post("/req", getResource);

  app.all("*", (req, res) => {
    res.type("text/plain; charset=utf-8");
    res.send(login);
  });

  return app;
};
