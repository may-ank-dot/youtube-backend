import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById({userId})
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false}) // validateBeforeSave will save this without checking requiring password 

        return {accessToken, refreshToken}

    } catch (error) {
       throw new ApiError(500, "Something went wrong! while generating access and refresh token") 
    }
}

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

const loginUser = asyncHandler( async (req,res) => {
    // taking user input username and password
    // find user
    // check password
    // set refresh and access token if loged in
    // send cookies
    // send response
    const{email, username, password} = req.body
    if(!username || !email)
        throw new ApiError(400, "Username or email is required!")

    const user = await User.findOne({
        $or:[{username},{email}] 
    })
    if(!user) 
        throw new ApiError(404, "user does not exist")

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid) 
        throw new ApiError(401, "Invalid user credentials")

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)    

    const loggedInUser = await User.findById(user._id)
                                    .select("-password -refreshToken")

    // cookies
    const options = {
        // the cookie will only be modified by server
        httpOnly: true,
        secure: true,
    }
    return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User loggedIn successfullly"
                )
            )
})

const logoutUser = asyncHandler( async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            refreshToken: undefined
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200,{},"User logged out")
            )
})

export {registerUser, loginUser, logoutUser}