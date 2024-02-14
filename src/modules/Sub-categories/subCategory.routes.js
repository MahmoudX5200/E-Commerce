
import { Router } from "express";
const router = Router();
import * as subCategoryController from './subCategory.controller.js'
import expressAsyncHandler from "express-async-handler";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { endPointsRoles } from "../Category/category.endpoints.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";


router.post('/:categoryId',
    auth(endPointsRoles.ADD_CATEGORY),
    multerMiddleHost({
        extensions: allowedExtensions.image
    }).single('image'),
    expressAsyncHandler(subCategoryController.addSubCategory))
router.get("/:SubCat",auth(),expressAsyncHandler(subCategoryController.getAllSubCategories))
router.delete("/",auth(),expressAsyncHandler(subCategoryController.deleteSubCategory))
router.put("/",auth(),expressAsyncHandler(subCategoryController.updateSubCategory))
export default router;