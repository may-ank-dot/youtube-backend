import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const publishVideo = asyncHandler(async (req, res) => {
  const {
    title,
    description
  } = req.body

  let videoLocalPath, thumbnailLocalPath;
  if (req.files && Array.isArray(req.files.video) && req.files.video.length > 0)
    videoLocalPath = req.files.video[0].path

})

const getVideoById = asyncHandler(async (req, res) => {

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
