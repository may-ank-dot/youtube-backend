import { Router } from "express"
import {
  publishVideo,
  deleteVideo,
  getAllVideo,
  updateVideo,
  togglePublishStatus,
  getVideoById
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/upload").post(
  verifyJWT,
  upload.fields([
    {
      name: "video",
      maxCount: 1
    },
    {
      name: "thumbnail",
      maxCount: 1
    }
  ]),
  publishVideo
)
export default router
