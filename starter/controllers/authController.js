const crypto = require('crypto')
const {promisify} = require('util');
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const sendEmail = require('./../utils/email')

const signToken = id => {
	return jwt.sign({ id },process.env.JWT_SECRET,{
		expiresIn: process.env.JWT_EXPIRES_IN
	})
}

const createSendToken = (user,statusCode,res)=>{
	const token = signToken(user._id)
	
	const cookieOptions = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
		// secure: true, // Only be sent on encrepted connection https
		httpOnly: true // cannot be accessed on modified by the browser so it protects the cookie and the website // with this command we only receive thte cokie and sent the cookie
	}

	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

	res.cookie('jwt',token,cookieOptions)

	user.password = undefined // remove password fromt he output

	res.status(statusCode).json({
		status:'success',
		token,
		data:{
			user
		}
	})
}

exports.signup = catchAsync(async(req,res,next)=>{
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		role: req.body.role,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
		passwordChangedAt: req.body.passwordChangedAt

	})

	createSendToken(newUser,201,res)
})

exports.login = catchAsync(async (req,res,next)=>{
	// const email = req.body.email;
	// const password = req.body.password;
	const {email, password} = req.body;

	// 1) Check if email and password exist
	if (!email || !password){
		return next(new AppError('Please provide email and password'),400);
	}

	// 2) Check if the user exist and the password is correct
	const user = await User.findOne({email}).select('+password')

	
	//3) Check the token back to the client
	
	if (user){
		const correct = await user.correctPassword(password,user.password)
		if (!correct){
			return next(new AppError('Incorrect email or password'),401);
		}
	}else{
		return next(new AppError('Incorrect email or password'),401);	
	}


	createSendToken(user,200,res)
})

exports.protect = catchAsync(async(req,res,next)=>{
	// 1) Getting token and check if exists
	let token;

	if (req.headers.authorization && req.headers.authorization.split(' ')[0]=="Bearer"){
		token = req.headers.authorization.split(' ')[1]
	} else if (req.cookies.jwt){
		token = req.cookies.jwt
	}
	console.log(token)
	if (!token){
		return next(new AppError('You are not logged in! Please login'),401)
	}

	// 2) Verification token
	const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)

	// 3) check if user still exists
	const currentUser = await User.findById(decoded.id) // Here we find the user 
	if (!currentUser){// This means that the user was changed so we need to stop the procees 
		return next(new AppError('The user belonging to the token doesnt exist anymore'),401);	
	}

	// 4) Check if user changes password after JWT was isseud
	console.log(currentUser.changesPasswordAfter(decoded.iat))
	if (currentUser.changesPasswordAfter(decoded.iat)===true){ // This is the timestamp (iat) = Issued At
		return next(new AppError('User recently changes password! please log in again'),401);	 
	}


	req.user = currentUser; // SOS SOS SOS // Here we are storing the user for later usage 
	next(); // Grant access to protected route
})

// only for render pages, no errors
exports.isLoggedIn = catchAsync(async(req,res,next)=>{
	// 1) Getting token and check if exists
	let token;

	if (req.cookies.jwt){
		token = req.cookies.jwt

		//verify token
		const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)


		const currentUser = await User.findById(decoded.id) // Here we find the user 
		if (!currentUser){// This means that the user was changed so we need to stop the procees 
			return next();	
		}


		// console.log(currentUser.changesPasswordAfter(decoded.iat))
		if (currentUser.changesPasswordAfter(decoded.iat)===true){ // This is the timestamp (iat) = Issued At
			return next();	 
		}
		console.log(currentUser)
		// There is a logged in user
		res.locals.user = currentUser
		// req.user = currentUser; 
		return next(); // Grant access to protected route
	}
	next()
})

exports.restrictTo = (...roles)=>{
	return (req,res,next)=>{
		// roles is an array ['admin','lead-guide']
		if (!roles.includes(req.user.role)){
			return next(new AppError('You dont have permission to get here'),403);	 
		}

		next(); // If it is included in the list it means that we can continue here so we have access to this funciton 
	}


}

exports.forgotPassword = catchAsync(async (req,res,next)=>{
	// 1) Get user based on POSted email
	const user = await User.findOne({email: req.body.email});
	if (!user){
		return next(new AppError('There is no user with this email address'),404); // not found 	 
	}

	// 2) Generate the random reset password
	const resetToken = user.createPasswordResetToken();
	await user.save({validateBeforeSave: false})

	// 3) Send it to users email 
	// The user will click this link and will go to the page for restarting the password
	const resetURL = `${req.protocol}://${req.get(
		'host')}/api/v1/users/resetPassword/${resetToken}`

	console.log(resetToken)
	console.log(resetURL)

	const message = `Forgot your password? submit a PATCH request with your new password to: ${resetURL}.\n If you didn't forget your password please ingore this email`

	try{
		await sendEmail({
			email: user.email,
			subject: 'your password reset token (valid for 10 mintues)',
			message
		});

		res.status(200).json({
			status: 'success',
			message: 'Token sent to email!'
		})

	} 
	catch (err){
		user.passwordResetToken = undefined
		user.passwordResetExpires = undefined
		await user.save({validateBeforeSave: false})

		return next(new AppError('There was an error sending the email'),500); // not found 	 
	}


})//

exports.resetPassword = catchAsync(async (req,res,next)=>{
	// 1) Get user based on the token
	const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

	const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}})

	// 2) If token has not expired and there is user set the new password
	if (!user){
		return next(new AppError('Token is invalid or has expired'),400); // not found 	 
	}
	user.password = req.body.password
	user.passwordConfirm = req.body.passwordConfirm
	user.passwordResetToken = undefined
	user.passwordResetExpires = undefined
	await user.save();

	// 3) Update changedPasswordAt propery for the user
	
	// 4) log the user in senf JWT


	createSendToken(user,200,res)
})

exports.updatePassword = catchAsync(async(req,res,next) =>{
	// 1) Get user from collection
	console.log("asdfaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	const user = await User.findById(req.user.id).select('+password') // This comes from the protect middleware that we did a save of the user

	// 2) check if posted current password is correct
	if (!(await user.correctPassword(req.body.passwordCurrent,user.password))){
		return next(new AppError('Your current password is wrong '),401); // not found 	 
	}
	
	// 3) if so upated password
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm
	await user.save();
	// User.findByIdAndUpate will not work becasue the validation steps dont happen when you update

	// 4) log user in send jwt
	createSendToken(user,200,res)


});