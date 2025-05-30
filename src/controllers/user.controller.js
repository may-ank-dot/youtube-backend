import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { error } from "console"

const registerUser = asyncHandler( async (req,res) => {

    const {fullname, email, password, username} = req.body;
    if([fullname, email, password, username]
        .some(field => field?.trim() === "")
    ) {
        throw new ApiError(400,"All fields are required")
    }
    const existedUser = await User.findOne(
        { $or:[{username},{email}]}
    )
    if(existedUser) 
       throw new ApiError(409, "Username or email already exists!")

    let avatarLocalPath 

    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0)
        avatarLocalPath = req.files.avatar[0].path 
    else 
        throw new ApiError(400, "avatar file is required")

    let coverImageLocalPath
    (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) 
        ? coverImageLocalPath = req.files.coverImage[0].path : coverImageLocalPath = ""

    if(!avatarLocalPath)
        throw new ApiError(400,"Avatar file is required")

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar)
        throw new ApiError(400,"Avatar file is required cloudinary")

    const user = await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        }
    )
    const createdUser = await User.findById(user._id)
        .select(
            "-password -refreshToken"  // this will remove these 2 fields when getting details of user
        )
    if(!createdUser)
        throw new ApiError(500,"Unable to register user")

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
       
})

export {registerUser}