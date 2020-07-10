const express = require('express')
const userController = require('./../controllers/userController')
const authController = require('./../controllers/authController')



const router = express.Router(authController.signup)

router.post('/signup',authController.signup)
router.post('/login',authController.login)

router.post('/forgotPassword',authController.forgotPassword)
router.patch('/resetPassword/:token',authController.resetPassword)

// router.use(authController.protect) // protect all the routes at the same time 

router.patch('/updateMyPassword',authController.updatePassword)

router.get('/me',userController.getMe,userController.getUser)
router.patch('/updateMe',userController.updateMe)
router.delete('/deleteMe',userController.deleteMe)
// router.delete('/deleteMe',userController.deleteMe)

// router.use(authController.restrictTo('admin')) // After this only admin can make this changes 

router
	.route('/')
	.get(userController.getAllUsers)
	.post(userController.createUser)
router
	.route('/:id')
	.get(userController.getUser)
	.patch(userController.updateUser)
	.delete(userController.deleteUser)





module.exports = router;	
