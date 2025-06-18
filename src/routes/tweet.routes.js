import { Router } from "express"
import {
  createTweet,
  updateTweet,
  deleteTweet,
  getUserTweet,
  getAllTweets,
} from "../controllers/tweet.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

router.route("/create").post(createTweet)
router.route("/update/:tweetId").patch(updateTweet)
router.route("/delete/:tweetId").delete(deleteTweet)
router.route("/my-tweets/:userId").get(getUserTweet)
router.route("/all-tweets").get(getAllTweets)

export default router
