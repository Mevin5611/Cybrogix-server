import { Request,Response,NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import userModel from "../models/user.model";
import { json } from "stream/consumers";
import CourseModel from "../models/course.model";
import orderModel from "../models/order.model";


// get users analytics -- only for admin

export const getUserAnlytics = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const users = await generateLast12MonthsData(userModel)
        res.status(200).json({
            success:true,
            users
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500))
        
    }
})
// get courses analytics -- only for admin

export const getCourseAnlytics = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const courses = await generateLast12MonthsData(CourseModel)
        res.status(200).json({
            success:true,
            courses
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500))
        
    }
})

// get order analytics -- only for admin

export const getOrderAnlytics = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const orders = await generateLast12MonthsData(orderModel)
        res.status(200).json({
            success:true,
            orders
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500))
        
    }
})