import mongoose from "mongoose";
require('dotenv').config();

const dburl:string = process.env.MONGO_URI || '';

const connectDB = async ()=>{
    try {
        await mongoose.connect(dburl).then((data:any)=>{
            console.log(`Database Connected With ${data.connection.host}`);
            

        })
    } catch (error:any) {
        console.log(error.messege);
        setTimeout(connectDB,5000)
        
    }
}
export default connectDB;