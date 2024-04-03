require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: 'lax' | 'strict' | 'none' | undefined;
  secure?: boolean;
}

// pars enviviornment variables to integrates with fallback

 const accessTokenExpires = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
 const refreshTokenExpires = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// options for cookies

export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpires *60*60*1000),
  maxAge: accessTokenExpires *60*60*1000,
  httpOnly: true,
  sameSite: "none",
  secure:true
  
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpires* 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none",
  secure:true
  
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  //upload session token redis
  redis.set(user._id ,JSON.stringify(user) as any)

  

  // only set secure to true



  res.cookie('access_token', accessToken,accessTokenOptions)
  res.cookie('refresh_token',refreshToken,refreshTokenOptions)
  
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,

  })
};
