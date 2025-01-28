const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const routes = require("./routes");
const db = require("./models");

const port = process.env.PORT || 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

db.sequelize.sync().then(() => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
