import { Router } from "express"
import {
  publishVideo,
  deleteVideo,
  getAllVideo,
  updateVideo,
  togglePublishStatus,
  getVideoById,
  getVideoByUserId
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/upload").post(
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

router.route("/watch/:videoId").get(getVideoById)
router.route("/").get(getAllVideo)

// protected routes
router.route("/delete/:videoId").delete(verifyJWT, deleteVideo)
router.route("/update/:videoId").put(verifyJWT, upload.single("thumbnail"), updateVideo)
router.route("/my-videos").get(verifyJWT, getVideoByUserId)
router.route("toggle-publish/:videoId").patch(verifyJWT, togglePublishStatus)
export default router
