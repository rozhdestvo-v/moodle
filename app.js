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

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    next();
  });

  app.use((req, res, next) => {
    if (req.path !== "/" && !req.path.endsWith("/")) {
      const query = req.url.includes("?")
        ? req.url.substring(req.url.indexOf("?"))
        : "";

      return res.redirect(308, `${req.path}/${query}`);
    }

    next();
  });

  app.get("/login", (req, res) => {
    res.type("text/plain; charset=utf-8");
    res.send(login);
  });

  app.get("/code", (req, res) => {
    res.type("text/plain; charset=utf-8");
    createReadStream(import.meta.url.substring(7)).pipe(res);
  });

  app.get("/sha1/:input", (req, res) => {
    const hash = crypto
      .createHash("sha1")
      .update(req.params.input)
      .digest("hex");

    res.type("text/plain; charset=utf-8");
    res.send(hash);
  });

  const getResource = (req, res) => {
    const addr = req.query.addr || req.body?.addr;

    if (typeof addr !== "string" || addr.length === 0) {
      res.status(400);
      res.type("text/plain; charset=utf-8");
      res.send("Missing addr");
      return;
    }

    try {
      http
        .get(addr, (response) => {
          let content = "";

          response.setEncoding("utf8");

          response.on("data", (part) => {
            content += part;
          });

          response.on("end", () => {
            res.type("text/plain; charset=utf-8");
            res.send(content);
          });
        })
        .on("error", () => {
          res.status(502);
          res.type("text/plain; charset=utf-8");
          res.send("Request failed");
        });
    } catch {
      res.status(400);
      res.type("text/plain; charset=utf-8");
      res.send("Invalid addr");
    }
  };

  app.get("/req", getResource);
  app.post("/req", getResource);

  app.all(/.*/, (req, res) => {
    res.type("text/plain; charset=utf-8");
    res.send(login);
  });

  return app;
};
