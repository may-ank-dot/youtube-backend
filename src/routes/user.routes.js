import { Router } from "express"
import {
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateCurrentPassword,
  updateUserAvatar,
  updateUserCoverImage
} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
  verifyJWT,
  upload.fields(
    [
      {
        name: "avatar",
        maxCount: 1
      },
      {
        name: "coverImage",
        maxCount: 1
      }
    ]
  ),
  registerUser
)

router.route("/login").post(loginUser)

// Secured Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/update-password").post(verifyJWT, updateCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/watch-History").get(verifyJWT, getWatchHistory)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

export default router
