import notificationModel from "../models/notification.model";
import { NextFunction,Request,Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import cron from 'node-cron'

// get all notification for admin

export const getNotification = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const notifications = await notificationModel.find().sort({createdAt: -1})

        res.status(201).json({
            success:true,
            notifications,
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500))
        
    }
})
// update notification

export const updateNotification = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const notification = await notificationModel.findById(req.params.id)

        if(!notification){
            return next(new ErrorHandler("Notification not found ",404))
        }else{
            notification.status ? notification.status = "read" : notification.status

            await notification.save()
        }

        const notifications = await notificationModel.find().sort({createdAt: -1})

        res.status(201).json({
            success:true,
            notifications,
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500))
        
    }
})

// deleting notification automaticaly -- only admin  

cron.schedule("0 0 0 * * *",async()=>{
    
    const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await notificationModel.deleteMany({status:"read",createdAt:{$lt:thirtyDays}})

    console.log("deleted read notifications");
    
}) 

