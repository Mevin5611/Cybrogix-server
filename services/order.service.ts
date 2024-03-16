import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import orderModel from "../models/order.model";

// create new order

export const newOrder = CatchAsyncError(
  async (data: any, res: Response) => {
    const order = await orderModel.create(data);

    res.status(201).json({
      success: true,
      order,
    });
  }
);

// get all orders -- only for admin

export const getAllOrderServices = async(res:Response)=>{
  const orders = await orderModel.find().sort({createdAt:-1})

  res.status(201).json({
    success:true,
    orders,
  })
}