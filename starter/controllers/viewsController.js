const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync')

exports.getOverview = catchAsync(async(req,res,next)=>{
	// 1) Get tour data from collection
	const tours = await Tour.find();

	// 2) Build template

	tours.forEach(tour => { // round ratings 
		tour.ratingsAverage = Math.floor(tour.ratingsAverage * 100) / 100 
	})

	// 3) Render that template using tour data from (1)
	res.status(200).render('overview',{
		tour: 'All tours',
		tours
	});
});

exports.getTour = catchAsync(async(req,res,next)=>{
	// 1) get the data, for the requested tour (includeing tour guides and reviews)
	// console.log(req.params.id)
	console.log( req.params.id)
	// req.params.id = "5c88fa8cf4afda39709c2955"
	const tour = await Tour.findById(req.params.id)//.populate('reviews')
	.populate({
		path: 'reviews',
		fields: 'review rating user'
	})

	tour.ratingsAverage = Math.floor(tour.ratingsAverage * 100) / 100 

	console.log(tour)
	console.log(tour.reviews)
	//2) Vuild template

	// 3) Render template using the data from step (1)
	res.status(200).render('tour',{
		title: 'The Forest Hiker',//
		tour
	});
});


exports.getLoginForm = (req,res)=>{
	res.status(200).render('login',{
		title: 'log into your acount'
	})
}