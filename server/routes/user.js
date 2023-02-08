const router = require('express').Router()
const { signup, login, profile, refreshToken, logout } = require('../controllers/userController')
const { verifyJwt } = require('../middleware/verify_jwt')



router.post('/signup',signup)
router.post('/login',login)
router.get('/profile',verifyJwt,profile)
router.post('/refresh-token',refreshToken)
router.delete('/logout',logout)


module.exports = router