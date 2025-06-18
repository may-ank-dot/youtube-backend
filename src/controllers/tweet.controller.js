import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { Tweet } from "../models/tweet.models.js"

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body
  if (!content)
    throw new ApiError(400, "content is missing")

  // find if user is looged in or not 
  const user = await User.findById(req.user._id)
  if (!user)
    throw new ApiError(401, "user does not exists")

  const tweet = await Tweet.create(
    {
      content,
      owner: user._id
    }
  )

  return res
    .status(201)
    .json(
      new ApiResponse(201, tweet, "Tweet created successfully")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  if (!tweetId)
    throw new ApiError(400, "Tweet Id is required")

  const deletedTweet = await Tweet.findOneAndDelete(
    {
      _id: tweetId,
      owner: req.user._id
    }
  )
  if (!deletedTweet)
    throw new ApiError(404, "Tweet not found or you are not authorized!")

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedTweet, "tweet deleted successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  const { content } = req.body
  if (!tweetId)
    throw new ApiError(400, "Tweet Id is required")

  if (!content)
    throw new ApiError(400, "update content requried")

  const tweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: req.user._id
    },
    {
      content
    },
    {
      new: true
    }
  )
  if (!tweet)
    throw new ApiError(404, "tweet not found or you are not authenticated")

  return res
    .status(200)
    .json(
      new ApiResponse(200, tweet, "updated tweet successfully")
    )
})

const getAllTweets = asyncHandler(async (req, res) => {
  const tweet = await Tweet.find({})
  if (!tweet || tweet.length === 0)
    throw new ApiError(404, "no tweet found")

  return res
    .status(200)
    .json(
      new ApiResponse(200, tweet, "all tweets fetched")
    )
})

const getUserTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params
  if (!userId)
    // 400 bad request
    throw new ApiError(400, "user id not found!")

  const tweets = await Tweet.find(
    {
      owner: userId
    }
  )
  if (!tweets || tweets.length === 0)
    throw new ApiError(404, "no tweet found!")

  return res
    .status(200)
    .json(
      new ApiResponse(200, tweets, "found tweets")
    )

})

export {
  createTweet,
  deleteTweet,
  updateTweet,
  getAllTweets,
  getUserTweet,
}
