const createError = require('http-errors')
const jwt = require('jsonwebtoken')

const verifyJwt =(req,res,next)=>{
    try {
        //checking if the cookies found in header
        if(req.headers.cookie){

            const cookies = req.headers.cookie.split(/[ =]+/)

            //checking cookies has the accessToken
            if(!cookies.includes("accessToken")) throw createError.NotFound("No accesstoken in header")
           
            //finding the index and accessing the authToken
            const index = cookies.indexOf("accessToken")
            const token = cookies[index+1]


            //verfiying authToken with jwt
            jwt.verify(token,process.env.JWT_AUTH_SECRET,(err,user)=>{
                if(err) throw createError.Unauthorized(err)

                //putting that user to request header to access in the protected route
                req.user = user

                //go to next
                next()
            })

        }else{

            //throwing error if there is no cookies in header
            throw createError.NotFound("No cookies in header")
        }
    } catch (error) {
        //if any thing goes wrong with the try block send errors to the client
        res.status(error.status || 500).json({success:false,message:error.message || "Something went wrong"}) 
    }
}

module.exports = {verifyJwt}