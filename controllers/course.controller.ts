import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse, getAllCourseService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import notificationModel from "../models/notification.model";
import axios from "axios";
// upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumpbnail = data.thumbnail;
      if (thumpbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumpbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Edit course

export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      const courseID = req.params.id;
      const courseData = (await CourseModel.findById(courseID)) as any;

      if (thumbnail && typeof thumbnail === "string" && !thumbnail.startsWith("https")) {
        await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);
        const photo = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "course",
        });

        data.thumbnail = {
          public_id: photo.public_id,
          url: photo.secure_url,
        };
      }

      if (typeof thumbnail === "string" && thumbnail.startsWith("https")) {
        data.thumbnail = {
          public_id: courseData?.thumbnail.public_id,
          url: courseData?.thumbnail.url,
        };
      }
      /* if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);

        const mycloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: mycloud.public_id,
          url: mycloud.secure_url,
        };
      } */
      const courseId = req.params.id;
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        {
          new: true,
        }
      );
      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course without purchase

export const getSingleCource = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      /* const isCacheExist = await redis.get(courseId); */

      /* if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        console.log("hitting redis");

        res.status(200).json({
          success: true,
          course,
        });
      } else { */
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        console.log("hitting mongodb");

        await redis.set(courseId, JSON.stringify(course),"EX",604800);
        res.status(200).json({
          success: true,
          course,
        });
      
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses without purchasing

export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      /* const isCacheExist = await redis.get("allCourses");
      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);
        console.log("hitting redis");
        res.status(200).json({
          success: true,
          courses,
        });
      } else { */
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        await redis.set("allCourses", JSON.stringify(courses));
        console.log("hitting mongodb");
        res.status(200).json({
          success: true,
          courses,
        });
      
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get course content--- only for valid user

export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      const isCourseExist = userCourseList?.find(
        (course: any) => course._id === courseId
      );

      if (!isCourseExist) {
        return next(
          new ErrorHandler("You are not eligible to access this course ", 404)
        );
      }
      const course = await CourseModel.findById(courseId);
      const content = course?.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add question in course

interface IAddQuestion {
  question: string;
  courseId: string;
  contentId: string;
}

export const AddQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestion = req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("invalid content id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("invalid content id", 400));
      }

      //create new question

      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      // add this new question object to content data

      courseContent.questions.push(newQuestion);

      //notification 
      
      await notificationModel.create({
        user:req.user?._id,
        title: "New Question Recived",
        message: `You Have a new question in ${courseContent.title}`,
      });

      // save the course

      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add answer to the question

interface IAddAnswer {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId } = req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("invalid content id", 400));
      }
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("invalid content id", 400));
      }
      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandler("invalid question id", 400));
      }
      // create new answer

      const newAnswer: any = {
        user: req.user,
        answer,
      };

      // add this answer to our course content

      question.questionReplies.push(newAnswer);

      await course?.save();

      if (req.user?._id === question.user._id) {
        // create notification
        await notificationModel.create({
          user:req.user?._id,
          title: "New Question Replay Recived",
          message: `You Have a new question replay in ${courseContent.title}`,
        });
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-replay.ejs"),
          data
        );

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Replay",
            template: "question-replay.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add review in course

interface IAddReview {
  review: string;
  courseId: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      // check if courseId alredu exist in userCourse list
      const courseExist = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      );

      if (!courseExist) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }
      const course = await CourseModel.findById(courseId);

      const { review, rating } = req.body as IAddReview;

      const newReview: any = {
        user: req.user,
        comment: review,
        rating,
      };

      course?.reviews.push(newReview);

      let avg = 0;

      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });

      if (course) {
        course.ratings = avg / course.reviews.length;
      }

      await course?.save();

      //create notification
      await notificationModel.create({
        user:req.user?._id,
        title: "New review recived",
        message: `${req.user?.name} has given a review in ${course?.name}`,
      });

      

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add replay in review

interface IReviewReplay {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReviewReplay = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IReviewReplay;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("course not found", 404));
      }

      const review = course.reviews.find(
        (rev: any) => rev._id.toString() === reviewId
      );

      if (!review) {
        return next(new ErrorHandler("review not found", 404));
      }

      const newReplay: any = {
        user: req.user,
        comment,
      };

      if (!review.commentReplies) {
        review.commentReplies = [];
      }

      review.commentReplies.push(newReplay);

      await course?.save();

      await notificationModel.create({
        user:req.user?._id,
        title: "New review replay recived",
        message: `${req.user?.name} has given a replay in your review in ${course?.name}`,
      });

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// get all courses -- only for admin

export const getAllCourse = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    getAllCourseService(res)
    
  } catch (error:any) {
    return next(new ErrorHandler(error.message,500))
  }
})

// delete course only for admin

export const deleteCourse = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const _id = req.params.id

    const course = await CourseModel.findById(_id)

    if(!course){
      return next(new ErrorHandler("course not found",404))
    }

    await course.deleteOne({_id})
    await redis.del(_id)
    


    res.status(201).json({
      success:true,
      message:"Course deleted successfully"
    })
    

  } catch (error:any) {
    return next(new ErrorHandler(error.message,500))
  }
})

// generate video url

export const generateVideoUrl = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {videoId} = req.body
    const response = await axios.post(
      `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
      { ttl: 300 },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VIDEOCIPHER_API_SERECT}`,
          },
        }
    )
    res.json(response.data)
  } catch (error:any) {
    return next(new ErrorHandler(error.message,400))
  }
})