import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler( async (req,res) => {
    // get user details 
    // validation
    // check if user already exists: username and email
    // check for images
    // check for avatar
    // upload to cloudinary,avatar
    // create user object-create entry in db
    // remove password and reference token field from response
    // check for user creation
    // return response

    const {fullname, email, password, username} = req.body;
    if([fullname, email, password, avatar]
        .some(field => field?.trim() === "")
    ) {
        ApiError(400,"All fields are required")
    }
    const existedUser = User.findOne(
        { $or:[{username},{email}]}
    )
    if(existedUser) 
       throw new ApiError(409, "Username or email already exists!")
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImg[0]?.path

    if(!avatarLocalPath)
        throw new ApiError(400,"Avatar file is required")

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar)
        throw new ApiError(400,"Avatar file is required")

    const user = await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverImg: coverImage?.url || "",
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