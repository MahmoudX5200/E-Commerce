import { Router } from 'express'
import expressAsyncHandler from 'express-async-handler'

import * as brandController from './brand.controller.js'
import { multerMiddleHost } from '../../middlewares/multer.js'
import { allowedExtensions } from '../../utils/allowed-extensions.js'
import { endPointsRoles } from './brand.endpoints.js'
import { auth } from '../../middlewares/auth.middleware.js'
const router = Router()





router.post('/',
    auth(endPointsRoles.ADD_BRAND),
    multerMiddleHost({
        extensions: allowedExtensions.image
    }).single('image'),
    expressAsyncHandler(brandController.addBrand))
router.put("/",expressAsyncHandler(brandController.updateBrands))
router.delete("/",expressAsyncHandler(brandController.deleteBrand))
router.get('/',expressAsyncHandler(brandController.getBrands))

export default router
