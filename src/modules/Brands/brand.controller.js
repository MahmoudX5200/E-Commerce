import slugify from 'slugify'

import Brand from '../../../DB/Models/brand.model.js'
import subCategory from '../../../DB/Models/sub-category.model.js'
import cloudinaryConnection from '../../utils/cloudinary.js'
import generateUniqueString from '../../utils/generate-Unique-String.js'


//======================= add brand =======================//
export const addBrand = async (req, res, next) => {
    // 1- desturcture the required data from teh request object
    const { name } = req.body
    const { categoryId, subCategoryId } = req.query
    const { _id } = req.authUser
    // category check , subcategory check
    // 2- subcategory check
    const subCategoryCheck = await subCategory.findById(subCategoryId).populate('categoryId', 'folderId')
    if (!subCategoryCheck) return next({ message: 'SubCategory not found', cause: 404 })

    // 3- duplicate  brand document check 
    const isBrandExists = await Brand.findOne({ name, subCategoryId })
    if (isBrandExists) return next({ message: 'Brand already exists for this subCategory', cause: 400 })

    // 4- categogry check
    if (categoryId != subCategoryCheck.categoryId._id) return next({ message: 'Category not found', cause: 404 })

    // 5 - generate the slug
    const slug = slugify(name, '-')

    // 6- upload brand logo
    if (!req.file) return next({ message: 'Please upload the brand logo', cause: 400 })

    const folderId = generateUniqueString(4)
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${subCategoryCheck.categoryId.folderId}/SubCategories/${subCategoryCheck.folderId}/Brands/${folderId}`,
    })

    const brandObject = {
        name, slug,
        Image: { secure_url, public_id },
        folderId,
        addedBy: _id,
        subCategoryId,
        categoryId
    }

    const newBrand = await Brand.create(brandObject)

    res.status(201).json({
        status: 'success',
        message: 'Brand added successfully',
        data: newBrand
    })

}



//================================ upadte Brands ================================//
export const updateBrands = async (req, res, next) => {
    const { name, oldPublicId} = req.body
    const { categoryId } = req.params
    const { _id } = req.authUser

    const category = await Brand.findById(categoryId)
    if (!category) return next({ cause: 404, message: 'Category not found' })

    if (name) {
        if (name == category.name) {
            return next({ cause: 400, message: 'Please enter different category name from the existing one.' })
        }

        // 5.2 check if the new category name is already exist
        const isNameDuplicated = await Category.findOne({ name })
        if (isNameDuplicated) {
            return next({ cause: 409, message: 'Category name is already exist' })
        }

        // 5.3 update the category name and the category slug
        category.name = name
        category.slug = slugify(name, '-')
    }


    if (oldPublicId) {
        if (!req.file) return next({ cause: 400, message: 'Image is required' })

        const newPulicId = oldPublicId.split(`${category.folderId}/`)[1]

        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${category.folderId}`,
            public_id: newPulicId
        })

        category.Image.secure_url = secure_url
    }


    category.updatedBy = _id

    await Brand.save()
    res.status(200).json({ success: true, message: 'Brand updated successfully', data: category })
}


//====================== delete Brands ======================//
export const deleteBrand = async (req, res, next) => {
    const { categoryId } = req.params

    // 1- delete category
    const catgory = await Brand.findByIdAndDelete(categoryId)
    if (!catgory) return next({ cause: 404, message: 'Brand not found' })

    // 2-delete the related subcategories
    const Brands = await Brand.deleteMany({ categoryId })
    if (Brands.deletedCount <= 0) {
        console.log('There is no related Brands');
    }

    //3- delete the related brands
    const brands = await Brand.deleteMany({ categoryId })
    if (brands.deletedCount <= 0) {
        console.log(brands.deletedCount);
        console.log('There is no related brands');
    }


    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${catgory.folderId}`)
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${catgory.folderId}`)

    res.status(200).json({ success: true, message: 'Category deleted successfully' })
}

//============================== get all Brands ==============================//
export const getBrands = async (req, res, next) => {
    const{name}=req.body
    const Brands = await Brand.find({name})
    res.status(200).json({ success: true, message: 'Brands fetched successfully', data: Brands })
}
