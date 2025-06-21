import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const publishVideo = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    isPublished,
  } = req.body

  if (!(title, description))
    throw new ApiError(400, "all fields are required")
  let videoLocalPath, thumbnailLocalPath;

  if (req.files && Array.isArray(req.files.video) && req.files.video.length > 0)
    videoLocalPath = req.files.video[0].path
  else
    throw new ApiError(400, "video is required")

  if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0)
    thumbnailLocalPath = req.files.thumbnail[0].path
  else
    throw new ApiError(400, "thumbnail is required")

  const videoFile = await uploadOnCloudinary(videoLocalPath)
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if (!videoFile)
    throw new ApiError(400, "video file is required cloudinary")
  if (!thumbnail)
    throw new ApiError(400, "thumbnail file is required cloudinary")

  const duration = videoFile.duration

  const videoUpload = await Video.create(
    {
      videoFile: videoFile?.url,
      thumbnail: thumbnail?.url,
      title,
      description,
      duration,
      isPublished: isPublished || true,
      owner: req.user?._id
    }
  )

  return res
    .status(200)
    .json(
      new ApiResponse(200, videoUpload, "video upload success")
    )

})

const getVideoById = asyncHandler(async (req, res) => {

})

const getAllVideo = asyncHandler(async (req, res) => {

})

const updateVideo = asyncHandler(async (req, res) => {

})

const togglePublishStatus = asyncHandler(async (req, res) => {

})

const deleteVideo = asyncHandler(async (req, res) => {

})


export {
  publishVideo,
  deleteVideo,
  getAllVideo,
  updateVideo,
  togglePublishStatus,
  getVideoById
}
