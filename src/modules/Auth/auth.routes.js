
import { Router } from "express";
import * as authController from './auth.controller.js';
import expressAsyncHandler from "express-async-handler";
const router = Router();


router.post('/', expressAsyncHandler(authController.signUp))
router.get('/verify-email', expressAsyncHandler(authController.verifyEmail))
router.post('/login', expressAsyncHandler(authController.signIn))
router.put("/",expressAsyncHandler(authController.updateAccount))
router.delete("/",expressAsyncHandler(authController.deleteAccount))
router.get("/profile",expressAsyncHandler(authController.getUserProfile))



export default router;