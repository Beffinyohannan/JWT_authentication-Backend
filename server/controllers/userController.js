const User = require('../model/userSchema')
const bcrypt = require('bcrypt')
const createError = require("http-errors");
const jwt = require('jsonwebtoken')
const { genAccessToken, genRefreshToken } = require('../helpers/JWT')
const createHttpError = require('http-errors')

let refreshTokenArray = []

const signup = async (req, res, next) => {
    const { name, email, phone, password } = req.body
    try {

        // check weather the user is already exist
        let isExist = await User.findOne({ email: email })
        if (isExist) throw createError.Conflict("This email already in use");

        // hasing the password 
        const hash = await bcrypt.hash(password, 12)

        const newUser = new User({
            name,
            email,
            phone,
            password: hash,
        });

        const user = await newUser.save()
        res.send(user)

    } catch (error) {
        console.log(error);
        next(error)
    }

}

const login = async (req, res, next) => {
    const { email, password } = req.body
    try {
        // check the email is in the database
        const user = await User.findOne({ email: email })
        if (!user) throw createError.NotFound("No user found")

        // compareing the password 
        const pswrd = await bcrypt.compare(password, user.password)
        if (!pswrd) throw createError.Unauthorized("password is incorrect");

        // generating acess-token and refresh-token
        const accessToken = await genAccessToken(user)
        const refreshToken = await genRefreshToken(user)

        // set the refresh-token in to an array
        refreshTokenArray.push(refreshToken)

        // set the access-token to the cookies
        res.status(200)
            .cookie("accessToken", accessToken, {
                httpOnly: true,
                path: "/",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: "strict",
            }).json({ success: true, user, refreshToken })
    } catch (error) {
        console.log(error);
        next(error)
    }
}

const profile = async (req, res, next) => {
    try {
        const profile = await User.findOne({ _id: req.user._id }).select({ name: 1, email: 1, phone: 1 })

        res.status(200).json({ success: true, profile, message: "Authenticated to profile route" })
    } catch (error) {
        console.log(error);
        next(error)
    }
}

const refreshToken = async (req, res, next) => {
    try {
        const { userId, refToken } = req.body
        console.log(req.body);

        //finding the user
        const user = await User.findOne({ _id: userId }).select({
            name: 1,
            email: 1,
            phone: 1
        });

        //if there is no ref token throwing err
        if (!refToken)
            throw createHttpError.InternalServerError("no refresh token found");

        //get the ref token from the array with
        if (!refreshTokenArray.includes(refToken)) throw createError.Unauthorized("Invalid refresh token")

        //verify the ref token from array
        jwt.verify(
            refToken,
            process.env.JWT_REFRESH_TOKEN_SECRET,
            async (err, data) => {
                if (err) throw createError.InternalServerError(err);

                //black listing the used refresh token
                refreshTokenArray = refreshTokenArray.filter((item => item != refToken))

                //if it matches create a new pair of auth token and refresh token
                const accessToken = await genAccessToken(user);
                const refreshToken = await genRefreshToken(user);

                //saving the new refresh token to array
                refreshTokenArray.push(refreshToken)

                //sending response to the client
                res
                    .status(200)
                    .cookie("accessToken", accessToken, {
                        httpOnly: true,
                        path: "/",
                        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                        sameSite: "strict",
                    })
                    .json({ success: true, message: "new pair of tokens created", refreshToken });
            }
        );


    } catch (error) {
        console.log(error);
        next(error)
    }
}

const logout = (req, res, next) => {
    try {
        //get the ref token from body
        const { refToken } = req.body;


        //if there is no ref token throwing err
        if (!refToken)
            throw createHttpError.InternalServerError("no refresh token found");

        //get the ref token from the array with
        if (!refreshTokenArray.includes(refToken)) throw createError.Unauthorized("Invalid refresh token")


        //if it matches
        jwt.verify(refToken, process.env.JWT_REFRESH_TOKEN_SECRET, async (err, data) => {
            if (err)throw createError.Unauthorized(
                    "ref token from failed verification"
                );

            //black listing the used refresh token
            refreshTokenArray = refreshTokenArray.filter((item => item != refToken))
                
            res.clearCookie("accessToken").json({ success: true, message: "Logged out successfully" });
        }
        );
    } catch (error) {
        console.log(error);
        next(error)
    }
}


module.exports = {
    signup,
    login,
    profile,
    refreshToken,
    logout
}