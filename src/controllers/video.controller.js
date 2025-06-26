import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
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
  const { videoId } = req.params
  if (!videoId)
    throw new ApiError(400, "video Id not found")

  const video = await Video.aggregate(
    [
      {
        $match: {
          _id
        }
      }
    ]
  )

  if (!video)
    throw new ApiError(400, "video not found!")

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "video found")
    )
})

const getAllVideo = asyncHandler(async (req, res) => {
  const video = await Video.find()
  if (!video)
    throw new ApiError(400, "no video found!")

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "video found")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body
  const { videoId } = req.params

  if (!videoId)
    throw new ApiError(400, "videoId not found")
  if (!(title && description))
    throw new ApiError(400, "title  and description required")

  let thumbnailLocalPath
  if (req.file && req.file?.thumbnail)
    thumbnailLocalPath = req.files?.thumbnail

  if (!thumbnailLocalPath)
    throw new ApiError(400, "thumbnail not found!")

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  const video = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req.user?._id
    },
    {
      title,
      description,
      thumbnail: thumbnail?.path
    },
    { new: true }
  )
  if (!video)
    throw new ApiError(400, "video not found or you are not authneticated")

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "video update success!")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { isPublish } = req.body
  const { videoId } = req.params

  if (typeof isPublish === "undefined")
    throw new ApiError(400, "Publish change required")

  const updatePublishStatus = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req.user?._id
    },
    {
      isPublished: isPublish
    },
    {
      new: true
    }
  )
  if (!updatePublishStatus)
    throw new ApiError(400, "failed to change publish status")
  res
    .status(200)
    .json(
      new ApiResponse(200, updatePublishStatus, "publish status changed")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  if (!videoId)
    throw new ApiError(400, "video Id not found")

  const deletedVideo = await Video.findOneAndDelete(
    {
      _id: videoId,
      owner: req.user?._id
    }
  )
  if (!deletedVideo)
    throw new ApiError(400, "video not found or you are not authorized")

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedVideo, "video deleted success")
    )
})

const getVideoByUserId = asyncHandler(async (req, res) => {
  const userId = req.user?._id
  if (!userId)
    throw new ApiError(400, "user not found")

  const allVideoById = Video.find(
    {
      owner: userId
    }
  )
  if (!allVideoById)
    throw new ApiError(400, "No video found")

  return res
    .status(200)
    .json(
      new ApiResponse(200, allVideoById, "videos found")
    )
})

export {
  publishVideo,
  deleteVideo,
  getAllVideo,
  updateVideo,
  togglePublishStatus,
  getVideoById,
  getVideoByUserId
}
