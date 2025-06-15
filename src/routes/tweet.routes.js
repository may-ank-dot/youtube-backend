import { Router } from "express"
import {
  createTweet,
  updateTweet,
  deleteTweet,
  getUserTweet,
  getAllTweets,
} from "../controllers/tweet.controller"
import { verifyJWT } from "../middlewares/auth.middleware"

const router = Router()
app.use(verifyJWT)

export default router
