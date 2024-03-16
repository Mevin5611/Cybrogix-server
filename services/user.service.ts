import userModel from "../models/user.model";
import { Response } from "express";
import { redis } from "../utils/redis";
import { error } from "console";

// get user by id

export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson);

    res.status(201).json({
      success: true,
      user,
    });
  }
};

// get all users -- only for admin

export const getAllUserService = async (res: Response) => {
  const users = await userModel.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    users,
  });
};

export const updateUserRoleService = async (res:Response,email:string,role:string) =>{

  const user = await userModel.findOne({email})
  if(user){
    const newuser = await user.updateOne({role})
    res.status(201).json({
      success:true,
      newuser,
    })
  }
  

}