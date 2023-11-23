import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "./constants.js";

export const createToken = (id: string, email: string, expiresIn: string) => {
  const payload = { id, email };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
  });

  return token;
};

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authorizationHeader = req.headers["authorization"];
  console.log("authorizationHeader", authorizationHeader);
  // Check if authorization header is undefined
  if (authorizationHeader === "Bearer null") {
    return res.status(401).json({ message: "Authorization header not present." });
  }

  const token = authorizationHeader.replace("Bearer ", "");
  console.log("check2", token);

  if (!token || token.trim() === "") {
    console.log("check5");
    return res.status(401).json({ message: "Token not received." });
  }

  return new Promise<void>((resolve, reject) => {
    return jwt.verify(token, process.env.JWT_SECRET, (err, success) => {
      if (err) {
        console.log("check3", token);
        reject(err.message);
        return res.status(401).json({ message: "Token expired or malformed." });
      } else {
        resolve();
        console.log("check4");
        res.locals.jwtData = success;
        return next();
      }
    });
  });
};
