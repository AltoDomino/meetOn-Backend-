import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import registerRouter from "./routes/auth.registrationRoutes";

import loginRouter from "./routes/auth.loginRoutes"
// import {
//   notFoundHandler,
//   serverErrorHandler,
// } from "./middleware/errorHandler.ts";


dotenv.config({ path: "C:\\meetOn-Backend-\\.env" });

const app = express();

app.use(express.json());
const PORT = process.env.PORT;

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} url: ${req.url} + ${req.body}`);
  next();
};

app.use(cors());

app.use(requestLogger);



app.use("/api/registration", registerRouter);

app.use("/api/login", loginRouter);

// app.use("/api", Settings);

// app.use(serverErrorHandler);

// app.use(notFoundHandler);

app.listen(PORT, () => {
  console.log(
    "Server is Successfully Running, and App is listening on port " + PORT
  );
});
