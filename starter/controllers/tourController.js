
const Tour = require('./../models/tourModel')	
const catchAsync = require("./../utils/catchAsync")
const AppError = require("./../utils/appError")
const factory = require('./handlerFactory')




exports.aliasTopTours = (req,res,next) =>{
	req.query.limit = '5'
	req.query.sort = '-ratingsAverage,price'
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
	console.log(req.query)
	next();
}



// 2) ROUTE HANDLERS
exports.getAllTours = factory.getAll(Tour)
// exports.getAllTours = catchAsync(async (req,res,next)=>{

// 	const features = new APIFeatures(Tour.find(),req.query)
// 		.filter()
// 		.sort()
// 		.limitFeilds()
// 		.paginate()


// 	const tours = await features.query;

// 	// SEND RESPONCE
// 	res.status(200).json({
// 		status:'success',
// 		results: tours.length,
// 		data: {
// 			tours
// 		}
// 	})
// })

// exports.getTour = factory.getOne(Tour,{path:'reviews'})
exports.getTour = catchAsync(async (req,res,next)=>{

	// const newTour = await Tour.findById(req.params.id)
	// const newTour = await Tour.findById(req.params.id, (err) => {
	// 	if (err) return next(new AppError('No tour found with that ID', 404));
	// })//.populate('guides')

	const newTour = await Tour.findById(req.params.id).populate('reviews')

	res.status(200).json({
		status:'success',
		data: {
			tour: newTour
		}
	})
})


exports.createTour = factory.createOne(Tour);
// exports.createTour = catchAsync(async (req,res,next)=>{  
// 	const newTour = await Tour.create(req.body);

// 	res.status(201).json({
// 		status: 'success',
// 		data:{
// 			tour: newTour
// 		}
// 	}) 
// })
exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req,res,next)=>{

// 	// const tour = await Tour.findByIdAndUpdate(req.params.id)
// 	const tour = await Tour.findByIdAndUpdate(req.params.id, (err) => {
// 	    if (err) return next(new AppError('No tour found with that ID', 404));
// 	});

	

// 	res.status(200).json({
// 		status: "success",
// 		data:{
// 			tour: tour
// 		}
// 	}) 

// })

exports.deleteTour = factory.deleteOne(Tour)
// exports.deleteTour = catchAsync(async (req,res,next)=>{

	
// 	await Tour.findByIdAndDelete(req.params.id, (err) => {	
// 	    if (err) return next(new AppError('No tour found with that ID', 404));
// 	});
	

// 	res.status(204).json({
// 		status: "success",
// 		data: null
// 	})
	
// })


exports.getTourStats = catchAsync(async (req,res,next) =>{

	const stats = await Tour.aggregate([
		{ // Here we select what is the entries that will be processed 
			$match: { ratingsAverage: {$gte: 4.5}}
		},
		{ // We calculate avg, min, max
			$group: {
				_id: '$difficulty', // With that way you group by difficulty
				num: {$sum: 1},
				numRatings: {$sum: '$ratingsQuantity'},
				avgRatng: {$avg: '$ratingsAverage'},
				avgPrice: {$avg: '$price'},
				minPrice: {$min: '$price'},
				maxPrice: {$max: '$price'},
			}
		},
		{
			$sort: {avgPrice: 1}
		}
	])

	res.status(201).json({
		status: "success",
		data: stats
	}) 
})

exports.getMontlyPlan = catchAsync(async (req,res,next) =>{

	const year = req.params.year * 1;

	const plan = await Tour.aggregate([
		{
			$unwind: '$startDates'
		},
		{
			$match: {
				startDates: {
					$gte: new Date(`${year}-01-01`),
					$lte: new Date(`${year}-12-31`),
				}
			}
		},
		{
			$group:{
				_id: {$month: '$startDates'}, 
				numTourStarts: {$sum: 1},
				tours: {$push: '$name'}
			}
		},
		{
			$addFields: {month: '$_id'}
		},
		{
			$project:{
				_id: 0
			}
		},
		{
			$sort: {numTourStarts: -1}
		},
		{
			$limit: 12
		}
	])

	res.status(201).json({
		status: "success",
		data: plan
	})
})


exports.getToursWithin = catchAsync(async (req,res,next)=>{
	const {distance,latlng,unit} = req.params;

	const [lat,lng] = latlng.split(",")

	const radius = unit ==='mi'? distance/3963.2 : distance/6378.1

	if (!lat || !lng){
		next(new AppError ("Please provide latitute and longitude in the format lat,lng",400))
	}
	console.log(distance,lat,lng,unit)

	const tours = await Tour.find({
		startLocation:{$geoWithin: {$centerSphere:[[lng,lat],radius]}}
	});

	res.status(201).json({
		status: 'success',
		resutlts: tours.length,
		data:{
			data: tours
		}
	})

});


exports.getDistances = catchAsync(async (req,res,next)=>{
	const {distance,latlng,unit} = req.params;

	const [lat,lng] = latlng.split(",")

	const radius = unit ==='mi'? distance/3963.2 : distance/6378.1

	if (!lat || !lng){
		next(new AppError ("Please provide latitute and longitude in the format lat,lng",400))
	}
	
	const distances = await Tour.aggregate([
	{
		$geoNear: {
			near: {
				type: 'Point',
				coordinates: [lng*1,lat*1]
			},
			distanceField: 'distance',
			distanceMultiplier: 0.001
		}
	},
	{
		$project: {
			distance: 1,
			name: 1
		}
	}
	])

	res.status(201).json({
		status: 'success',
		resutlts: distances.length,
		data:{
			data: distances
		}
	})

});