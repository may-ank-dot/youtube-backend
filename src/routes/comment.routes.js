import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router()
app.use(verifyJWT())


export default router
