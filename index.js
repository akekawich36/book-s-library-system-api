const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const db = require("./models");
const port = process.env.PORT || 3000;

const AuthRouter = require("./routes/AuthRouter");
const SystemRouter = require("./routes/SystemRouter");
const authMiddleware = require("./middleware/auth");

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", AuthRouter);
app.use("/api", authMiddleware, SystemRouter);

db.sequelize.sync().then(() => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
