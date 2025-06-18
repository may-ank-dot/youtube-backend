import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false }) // validateBeforeSave will save this without checking requiring password 

    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "Something went wrong! while generating access and refresh token")
  }
}

const registerUser = asyncHandler(async (req, res) => {

  const { fullname, email, password, username } = req.body;
  if ([fullname, email, password, username]
    .some(field => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }
  const existedUser = await User.findOne(
    { $or: [{ username }, { email }] }
  )
  if (existedUser)
    throw new ApiError(409, "Username or email already exists!")

  let avatarLocalPath

  if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0)
    avatarLocalPath = req.files.avatar[0].path
  else
    throw new ApiError(400, "avatar file is required")

  let coverImageLocalPath
  (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    ? coverImageLocalPath = req.files.coverImage[0].path : coverImageLocalPath = ""

  if (!avatarLocalPath)
    throw new ApiError(400, "Avatar file is required")

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar)
    throw new ApiError(400, "Avatar file is required cloudinary")

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
  if (!createdUser)
    throw new ApiError(500, "Unable to register user")

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )

})

const loginUser = asyncHandler(async (req, res) => {
  // taking user input username and password
  // find user
  // check password
  // set refresh and access token if loged in
  // send cookies
  // send response
  const { email, username, password } = req.body
  if (!(username || email) && !password)
    throw new ApiError(400, "Username or email and password is required!")

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (!user)
    throw new ApiError(404, "user does not exist")

  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid)
    throw new ApiError(401, "Invalid user credentials")

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

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

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 }
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
      new ApiResponse(200, {}, "User logged out")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken)
    throw new ApiError(401, "unauthorized request")

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)
    if (!user)
      throw new ApiError(401, "Invalid refresh token")

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token is expired or used")

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})

const updateCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!(oldPassword && newPassword))
    throw new ApiError(400, "All fields are required")

  const user = await User.findById(req.user?._id)
  if (!user)
    throw new ApiError(404, "User not found")

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect)
    throw new ApiError(400, "Wrong current password!")

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Password updated successfully!")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        req.user,
        "Current user fetched successfully"
      ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, email, fullname } = req.body
  if (!username || !email || !fullname)
    throw new ApiError(400, "All fields are required")

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        fullname,  // this
        email: email,// this both will work same we can write anything from both,
        fullname // if both fields are same
      }
    },
    {
      new: true
    }
  ).select("-password")
  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "User updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath)
    throw new ApiError(400, "avatar file required")
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar.url)
    throw new ApiError(400, "Error while uploading avatar")

  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true
    }
  ).select("-password")
  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath)
    throw new ApiError(400, "Cover image file required")
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url)
    throw new ApiError(400, "Error while uploading coverImage")

  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  ).select("-password")
  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params
  if (!username?.trim())
    throw new ApiError(400, "username not found!")

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        form: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  if (channel?.length)
    throw new ApiError(404, "channel does not exists")


  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfullly")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Type.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                },
                {
                  $addFields: {
                    owner: {
                      $first: "$owner"
                    }
                  }
                }
              ]
            },
          }
        ]
      }
    }
  ])
  return res
    .status(200)
    .json(
      ApiResponse(200, user[0].watchHistory, "Wathc history fetched success")
    )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
}
