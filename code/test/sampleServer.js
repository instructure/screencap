const express = require("express");
const app = express();
const port = 2001;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port);
