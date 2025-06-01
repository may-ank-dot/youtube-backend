import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from "../models/user.models.js"
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler( async (req,_,next) => { // res is not being here, so i write _ 
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")     
        if(!token)
            throw new ApiError(401, "Unauthorized request")
    
        console.log(process.env.ACCESS_TOKEN_SECRET)
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user)
            throw new ApiError(401,"Invalid accessToken")
    
        req.user = user
        next()
    } catch (error) {
       throw new ApiError(401,"Invalid AccessToken") 
    }

})