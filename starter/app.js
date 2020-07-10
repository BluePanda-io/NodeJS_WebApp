const path = require('path')
const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')

const AppError = require("./utils/AppError")
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes')
const viewRouter = require('./routes/viewRoutes')

const app = express();

app.set('view engine','pug')
app.set('views',path.join(__dirname,'views'))


app.use(express.static(path.join(__dirname,'public')))

// Security HTTP headers
app.use(helmet())


if (process.env.NODE_ENV==="development"){
	app.use(morgan('dev')); // Shows you informaotin about the responce how much time it took the size etc
}

// Limit requests from same API
const limiter = rateLimit({
	max: 100,
	windowMs: 60*60*1000,
	message: ' Too many requests, please try again in an hour!'
})

app.use('/api',limiter)



// Body parser, reading data from the body into req.body
app.use(express.json({limit: '10kb'}));// This is importannt in order to take the data from the user // Limit the size of the json to 10kb
app.use(cookieParser())

// Data Sanitization agains NoSQL query injection
app.use(mongoSanitize())

// Data Sanitazation agains XSS (Xross Site Scripting attacks)
app.use(xss())

// prevent parameter polution // you can't have mulitple parameters only one 
app.use(hpp({
	whitelist:['duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price']
}))

//serving static files

// Test Middleware
app.use((req,res,next)=>{
	req.requestTime = new Date().toISOString();
	console.log(req.cookies)
	next();
})

// 3) ROUTE


app.use('/',viewRouter)
app.use('/api/v1/tours',tourRouter)
app.use('/api/v1/users',userRouter)
app.use('/api/v1/reviews',reviewRouter)


app.all('*',(req,res,next)=>{ // IF it reach this point then it means that there is a mistake
	const err = new AppError("can't find Server",404)
	next(err);
})

app.use(globalErrorHandler)

module.exports = app;