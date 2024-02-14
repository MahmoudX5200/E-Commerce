
import SubCategory from "../../../DB/Models/sub-category.model.js"
import Category from '../../../DB/Models/category.model.js'
import Brand from '../../../DB/Models/brand.model.js'
import generateUniqueString from "../../utils/generate-Unique-String.js"
import cloudinaryConnection from "../../utils/cloudinary.js"
import slugify from "slugify"

//============================== add SubCategory ==============================//
export const addSubCategory = async (req, res, next) => {
    // 1- destructuring the request body
    const { name } = req.body
    const { categoryId } = req.params
    const { _id } = req.authUser

    const isNameDuplicated = await SubCategory.findOne({ name })
    if (isNameDuplicated) {
        return next({ cause: 409, message: 'SubCategory name is already exist' })
    }

    const category = await Category.findById(categoryId)
    if (!category) return next({ cause: 404, message: 'Category not found' })

    const slug = slugify(name, '-')

    if (!req.file) return next({ cause: 400, message: 'Image is required' })

    const folderId = generateUniqueString(4)
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${category.folderId}/SubCategories/${folderId}`
    })

    const subCategory = {
        name,
        slug,
        Image: { secure_url, public_id },
        folderId,
        addedBy: _id,
        categoryId
    }
    const subCategoryCreated = await SubCategory.create(subCategory)
    res.status(201).json({ success: true, message: 'subCategory created successfully', data: subCategoryCreated })
}


//============================== get all subcategories ==============================//
export const getAllSubCategories = async (req, res, next) => {
    
    const subcategories = await SubCategory.find().populate( [{path: 'Brands'} ])
    
    res.status(200).json({ success: true, message: 'SubCategories fetched successfully', data: subcategories })
}

//====================== delete Subcategory ======================//
export const deleteSubCategory = async (req, res, next) => {
    const { SubcategoryId } = req.params

    const catgory = await SubCategory.findByIdAndDelete(SubcategoryId)
    if (!catgory) return next({ cause: 404, message: 'SubCategory not found' })

    const subCategories = await SubCategory.deleteMany({ SubcategoryId })
    if (subCategories.deletedCount <= 0) {
        console.log(subCategories.deletedCount);
        console.log('There is no related subcategories');
    }

    const brands = await Brand.deleteMany({ SubcategoryId })
    if (brands.deletedCount <= 0) {
        console.log(brands.deletedCount);
        console.log('There is no related brands');
    }

    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${catgory.folderId}`)
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${catgory.folderId}`)

    res.status(200).json({ success: true, message: 'Category deleted successfully' })
}

//================================ upadte category ================================//
export const updateSubCategory = async (req, res, next) => {
    // 1- destructuring the request body
    const { name, oldPublicId } = req.body
    // 2- destructuring the request params 
    const { SubcategoryId } = req.params
    // 3- destructuring _id from the request authUser
    const { _id } = req.authUser

    // 4- check if the category is exist bu using categoryId
    const category = await SubCategory.findById(SubcategoryId )
    if (!category) return next({ cause: 404, message: 'subCategory not found' })

    // 5- check if the use want to update the name field
    if (name) {
        // 5.1 check if the new category name different from the old name
        if (name == category.name) {
            return next({ cause: 400, message: 'Please enter different category name from the existing one.' })
        }

        // 5.2 check if the new category name is already exist
        const isNameDuplicated = await SubCategory.findOne({ name })
        if (isNameDuplicated) {
            return next({ cause: 409, message: 'SubCategory name is already exist' })
        }

        // 5.3 update the category name and the category slug
        category.name = name
        category.slug = slugify(name, '-')
    }


    // 6- check if the user want to update the image
    if (oldPublicId) {
        if (!req.file) return next({ cause: 400, message: 'Image is required' })

        const newPulicId = oldPublicId.split(`${category.folderId}/`)[1]

        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${checkSubcategory.categoryId.folderId}/subCategories/${checkSubcategory.folderId}`,
            public_id: newPulicId
        })

        category.Image.secure_url = secure_url
    }


    // 7- set value for the updatedBy field
    category.updatedBy = _id

    await SubCategory.save()
    res.status(200).json({ success: true, message: 'SubCategory updated successfully', data: category })
}
