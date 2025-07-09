"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.serverErrorHandler = void 0;
const serverErrorHandler = (error, req, res, next) => {
    let errorMessage = error.message;
    res.status(500).json({ message: errorMessage });
};
exports.serverErrorHandler = serverErrorHandler;
const notFoundHandler = (req, res, next) => {
    res.status(404).json({ error: 404, message: "Route not found" });
};
exports.notFoundHandler = notFoundHandler;
