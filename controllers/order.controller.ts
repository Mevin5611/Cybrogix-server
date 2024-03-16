import { NextFunction,Request,Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import orderModel, { IOrder } from "../models/order.model";
import CourseModel from "../models/course.model";
import userModel from "../models/user.model";
import path from "path";
import ejs from 'ejs'
import sendMail from "../utils/sendMail";
import notificationModel from "../models/notification.model";
import { getAllOrderServices, newOrder } from "../services/order.service";


// create order

 export const createOrder = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {courseId,payment_info} = req.body as IOrder;

        const user = await userModel.findById(req.user?._id)

        const courseExistInUser = user?.courses.some((course:any)=> course._id.toString() === courseId)

        if(courseExistInUser){
            return next(new ErrorHandler("You have alredy purchased this course",400))
        }
        const course = await CourseModel.findById(courseId)

        if(!course){
            return next(new ErrorHandler("course not found",400))
        }

        const data:any ={
            courseId:course._id,
            userId:user?._id,
            payment_info,
        }

        

        const mailData={
            order:{
                _id:course._id.toString().slice(0,6),
                name:course.name,
                benefits:course.benefits,
                price:course.price,
                date:new Date().toLocaleDateString('en-US',{year:"numeric",month:"long",day:'numeric'})
            }
        }

        const html = await ejs.renderFile(path.join(__dirname,"../mails/order-confirmation.ejs"),{order:mailData})

        try {
            if(user){
                await sendMail({
                    email: user?.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data:mailData,
                  });
            }
          } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
          }

          user?.courses.push(course?._id)

          await user?.save();

         await notificationModel.create({
            user:user?._id,
            title: "New Order",
            message: `You Have a new order from ${course?.name}`,
          });

          
          course.purchased = (course.purchased || 0) + 1 

       
          await course.save();

          newOrder(data,res,next)



    } catch (error:any) {
        return next(new ErrorHandler(error.message,500))
    }
 })

 // get all orders only for admins
 
 export const getAllOrders = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        getAllOrderServices(res)
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500))
    }
 })