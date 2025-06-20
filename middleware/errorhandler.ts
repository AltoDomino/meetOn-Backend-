import { NextFunction, Response, Request } from "express";

const serverErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let errorMessage = error.message;
  res.status(500).json({ message: errorMessage });
};

const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 404, message: "Route not found" });
};

export { serverErrorHandler, notFoundHandler };
