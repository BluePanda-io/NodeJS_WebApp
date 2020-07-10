const AppError = require('./../utils/appError')
const handleCastErrorDB = (err)=>{
	const message = `Invalid ${err.path}: ${arr.value}.`
	return new AppError(message, 400);
}

const sendErrorDev = (err,res) =>{
	res.status(err.statusCode).json({
		status: err.status,
		error:err,
		message: err.message,
		stack: err.stack
	})
}

const handleJWTError = err => AppError("Invalid token, please login again",401)

const handleJWTExpiredError = err => AppError("Your token has expired please login again",401)

const sendErrorProd = (err,res) =>{
	if (err.isOperational){ // Operational error that we trust and want to sent to the user
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message
		})
	} else{// Uknown error so we don't want to show the details to teh user
		// 1) Log Error
		console.error('Error = ',err);
		// 2) Generic message
		res.status(err.statusCode).json({
			status:  'error',
			message: ' Something went wrong'
		})
	}
}


module.exports = (err,req,res,next)=>{ // By specifing 4 parameters express automatically know that this is a error handler


	err.statusCode = err.statusCode || 500
	err.status = err.status || 'error'

	if (process.env.NODE_ENV==='development'){
		sendErrorDev(err,res)
	}else { // Production
		let error = {...err};
		if (error.name ==='CastError') error = handleCastErrorDB(error)

		if (error.name === 'JsonWebTokenError') error = handleJWTError(error)

		if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(error)

		sendErrorProd(error,res)
	}
	
}
