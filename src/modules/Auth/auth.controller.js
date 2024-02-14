import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import User from "../../../DB/Models/user.model.js"
import sendEmailService from "../../services/send-email.service.js"


// ========================================= SignUp API ================================//

/**
 * destructuring the required data from the request body
 * check if the user already exists in the database using the email
 * if exists return error email is already exists
 * password hashing
 * create new document in the database
 * return the response
 */
export const signUp = async (req, res, next) => {
    // 1- destructure the required data from the request body 
    const {
        username,
        email,
        password,
        age,
        role,
        phoneNumbers,
        addresses,
    } = req.body


    // 2- check if the user already exists in the database using the email
    const isEmailDuplicated = await User.findOne({ email })
    if (isEmailDuplicated) {
        return next(new Error('Email already exists,Please try another email', { cause: 409 }))
    }
    // 3- send confirmation email to the user
    const usertoken = jwt.sign({ email }, process.env.JWT_SECRET_VERFICATION, { expiresIn: '2m' })

    const isEmailSent = await sendEmailService({
        to: email,
        subject: 'Email Verification',
        message: `
        <h2>please clich on this link to verfiy your email</h2>
        <a href="http://localhost:3000/auth/verify-email?token=${usertoken}">Verify Email</a>
        `
    })
    // 4- check if email is sent successfully
    if (!isEmailSent) {
        return next(new Error('Email is not sent, please try again later', { cause: 500 }))
    }
    // 5- password hashing
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)

    // 6- create new document in the database
    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        age,
        role,
        phoneNumbers,
        addresses,
    })

    // 7- return the response
    res.status(201).json({
        success: true,
        message: 'User created successfully, please check your email to verify your account',
        data: newUser
    })
}



// ========================================= Verify Email API ================================//

export const verifyEmail = async (req, res, next) => {
    const { token } = req.query
    const decodedData = jwt.verify(token, process.env.JWT_SECRET_VERFICATION)
    // get uset by email , isEmailVerified = false
    const user = await User.findOneAndUpdate({
        email: decodedData.email, isEmailVerified: false
    }, { isEmailVerified: true }, { new: true })
    if (!user) {
        return next(new Error('User not found', { cause: 404 }))
    }

    res.status(200).json({
        success: true,
        message: 'Email verified successfully, please try to login'
    })
}


// ========================================= SignIn API ================================//



export const signIn = async (req, res, next) => {
    const { email, password } = req.body
    // get user by email
    const user = await User.findOne({ email, isEmailVerified: true })
    if (!user) {
        return next(new Error('Invalid login credentails', { cause: 404 }))
    }
    // check password
    const isPasswordValid = bcrypt.compareSync(password, user.password)
    if (!isPasswordValid) {
        return next(new Error('Invalid login credentails', { cause: 404 }))
    }

    // generate login token
    const token = jwt.sign({ email, id: user._id, loggedIn: true }, process.env.JWT_SECRET_LOGIN, { expiresIn: '1d' })
    // updated isLoggedIn = true  in database

    user.isLoggedIn = true
    await user.save()

    res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: {
            token
        }
    })
}

//  ======================== update Account API 


export const updateAccount = async (req, res, next) => {
    const { username, email, age } = req.body
    const { _id } = req.authUser

    if (email) {
        // email check
        const isEmailExists = await User.findOne({ email })
        if (isEmailExists) return next(new Error('Email is already exists', { cause: 409 }))
    }
    const updatedUser = await User.findByIdAndUpdate(_id, {
        username, email, age
    }, {
        new: true
    })
    if (!updatedUser) return next(new Error('update fail'))
    res.status(200).json({ message: 'done', updatedUser })
}



//  ======================= Delete Account API 


export const deleteAccount = async (req, res, next) => {
    const { _id } = req.authUser
    const deletedUser = await User.findByIdAndDelete(_id)
    if (!deletedUser) return next(new Error('delete fail'))
    res.status(200).json({ message: 'done' })
}


//  ===================== Get Account User 

export const getUserProfile = async (req, res, next) => {
    res.status(200).json({ message: "User data:", data: req.authUser })
}

