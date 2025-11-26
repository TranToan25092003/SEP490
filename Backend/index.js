// create server
const express = require("express");
const { createServer } = require("http");
const app = express();
const server = createServer(app);
const DomainError = require("./errors/domainError");
//end create server

require("dotenv").config(); // .env


// database
const database = require("./config/database");
const port = process.env.PORT;
database.connectToDatabase();


if (process.env.ENABLE_VERSION_TRACKING && process.env.ENABLE_VERSION_TRACKING === "true") {
  const mongoose = require("mongoose");
  const mongooseHistory = require("mongoose-history-plugin");
  const contextService = require("request-context");
  const uuid = require("uuid");

  app.use(contextService.middleware("request"));

  app.use((req, res, next) => {
    if (req.url === "/history/undo") {
      return next();
    }

    if (["POST", "PUT", "DELETE"].indexOf(req.method) === -1) {
      return next();
    }

    console.log("Before handling:", req.method, req.url);
    const requestId = uuid.v4();
    contextService.set("request:requestId", requestId);

    res.on("finish", async () => {
      console.log("After handling:", req.method, req.url, res.statusCode);

      await mongoose.connection.collection("__requests").insertOne({
        _id: requestId,
        method: req.method,
        url: req.url,
        timestamp: new Date(),
        statusCode: res.statusCode,
      });
    });

    next();
  });

  mongoose.plugin((schema) => {
    schema.pre("save", function (next) {
      this.__history = {
        requestId: contextService.get("request:requestId")
      };
      next();
    });
  });

  let historyCreated = false;

  const mongooseProxy = new Proxy(mongoose, {
    get: (target, prop) => {
      if (prop === "model") {
        return (name, schema) => {
          if (name === "__histories") {
            if (schema && !historyCreated) {
              historyCreated = true;
              return target.model(name, schema);
            }
            return target.model(name);
          }

          if (schema) {
            return target.model(name, schema);
          }
          return target.model(name);
        };
      }

      return target[prop];
    },
  });

  const config = {
    mongoose: mongooseProxy,
    userFieldName: "requestId",
    userCollectionIdType: String,
    userCollection: "__requests",
    ignorePopulatedFields: false,
  };

  const historyPluginNormal = mongooseHistory(config);

  mongoose.plugin((schema) => {
    if (schema.options.isEmbedded !== true) {
      historyPluginNormal(schema);
    } else {
      mongooseHistory({
        ...config,
        embeddedDocument: true,
        embeddedModelName: schema.options.embeddedModelName
      })(schema);
    }
  });
}
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

//admin router
const adminRouter = require("./API/admin/index.router");
adminRouter(app);

app.post("/history/undo", async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    const jsondiffpatch = require("jsondiffpatch");
    const lastestRequest = await mongoose.connection
      .collection("__requests")
      .findOne({}, { sort: { timestamp: -1 } });

    if (!lastestRequest) {
      return res.status(200).json({ message: "Không có yêu cầu nào để hoàn tác" });
    }

    const historyRecords = await mongoose.connection
      .collection("__histories")
      .find({ requestId: lastestRequest._id })
      .sort({ timestamp: -1 })
      .toArray();

    for (const record of historyRecords) {
      const Model = mongoose.model(record.collectionName);

      if (record.version === "0.0.0") {
        await Model.collection.deleteOne({ _id: record.collectionId });
      } else {
        const existingDoc = await Model.findOne({ _id: record.collectionId }).lean();
        const previousDoc = jsondiffpatch.unpatch(existingDoc, record.diff);
        await Model.updateOne({ _id: record.collectionId }, previousDoc);
      }
    }

    await mongoose.connection.collection("__requests").deleteOne({ _id: lastestRequest._id });
    await mongoose.connection
      .collection("__histories")
      .deleteMany({ requestId: lastestRequest._id });

    return res.status(200).json({ message: `Hoàn tác thành công API CALL ${lastestRequest.method} ${lastestRequest.url}` });
  } catch (err)  {
    next(err);
  }
});

app.get("/history/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const mongoose = require("mongoose");
  const request = await mongoose.connection.collection("__requests").findOne({ _id: requestId });
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  const historyRecords = await mongoose.connection
    .collection("__histories")
    .find({ requestId: requestId })
    .toArray();
  return res.json({
    request,
    historyRecords,
  });
});

app.get("/history", async (req, res) => {
  const mongoose = require("mongoose");
  const requests = await mongoose.connection
    .collection("__requests")
    .find({})
    .sort({ timestamp: -1 })
    .toArray();
  return res.json({
    requests,
  });
});


const separationMakesNoSense = require("./API");
separationMakesNoSense(app);

app.use((err, _, res, __) => {
  console.error(err);

  if (err instanceof DomainError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.errorCode,
    });
  }

  return res.status(500).json({
    message: "Internal Server Error",
  });
});

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
app.use("/api", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Swagger

// Initialize Socket.IO
const { initializeSocket } = require("./socket");
const { collection } = require("./model/test.model");
initializeSocket(server);

// Start server
server.listen(port, () => {
  console.log(`server is running at port ${port}`);
});
