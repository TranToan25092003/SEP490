// create server
const express = require("express");
const { createServer } = require("http");
const app = express();
const server = createServer(app);

//end create server

require("dotenv").config(); // .env

// database
const database = require("./config/database");
const port = process.env.PORT;
database.connectToDatabase();
//end database

// run cron tasks
const { runCronTasks } = require("./utils/cronTasks");
const cron = require("node-cron");
cron.schedule("* * * * *", async () => {
  try {
    await runCronTasks();
  } catch (error) {
    console.log("System is broken 😰😰😰");
  }
});
// end run cron tasks

// body parser
const bodyParser = require("body-parser");
app.use(bodyParser.json());
// end body parser

// cors
const cors = require("cors");
app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
  })
);
//end cors

// cookie-parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());
//end cookie-parser

// client router
const clientRouter = require("./API/client/index.router");
clientRouter(app);

// staff router
const staffRouter = require("./API/staff/index.router");
staffRouter(app);

// manager router
const managerRouter = require("./API/manager/index.router");
managerRouter(app);
// manager router

const separationMakesNoSense = require("./API");
separationMakesNoSense(app);

app.use((err, _, res, __) => {
  console.error(err);

  if (err instanceof DomainError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    });
  }

  return res.status(500).json({
    message: "Internal Server Error",
  });
});

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const DomainError = require("./errors/domainError");
app.use("/api", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Swagger

// Initialize Socket.IO
const { initializeSocket } = require("./socket");
initializeSocket(server);

// Start server
server.listen(port, () => {
  console.log(`server is running at port ${port}`);
});
