import express from "express";
import {
  registrationUser,
  activateUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updatePassword,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  deleteUser,
  updateUserCertificates,
  
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();

userRouter.post("/registration", registrationUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/refresh",updateAccessToken);
userRouter.get("/me", isAuthenticated, getUserInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put("/update-info",isAuthenticated, updateUserInfo);
userRouter.put("/update-password",updateAccessToken,isAuthenticated, updatePassword);
userRouter.put("/update-profile",updateAccessToken,isAuthenticated, updateUserProfile);
userRouter.post("/upload-certificate/:id",updateAccessToken,isAuthenticated,authorizeRoles("admin"),updateUserCertificates);
userRouter.get("/get-all-users",updateAccessToken,isAuthenticated,authorizeRoles("admin"),getAllUsers);
userRouter.put("/update-user-role",updateAccessToken,isAuthenticated,authorizeRoles("admin"),updateUserRole);
userRouter.delete("/delete-user/:id",updateAccessToken,isAuthenticated,authorizeRoles("admin"),deleteUser);

export default userRouter;
