const catchAsync = require("./../utils/catchAsync")
const AppError = require("./../utils/appError")
const APIFeatures = require('./../utils/apiFeatures')

exports.deleteOne = Model => catchAsync(async (req,res,next)=>{
	
	await Model.findByIdAndDelete(req.params.id, (err) => {	
	    if (err) return next(new AppError('No Document found with that ID', 404));
	});
	

	res.status(204).json({
		status: "success",
		data: null
	})
	
})

exports.updateOne = Model => catchAsync(async (req,res,next)=>{


	const doc = await Model.findByIdAndUpdate(req.params.id, req.body,{
		new: true,
		runValidation: true
	});
	
	res.status(200).json({
		status: "success",
		data:{
			data: doc
		}
	}) 

})


exports.createOne = Model => catchAsync(async (req,res,next)=>{  
	const doc = await Model.create(req.body);

	res.status(201).json({
		status: 'success',
		data:{
			data: doc
		}
	}) 
})

exports.getOne = (Model,popOptions) => catchAsync(async (req,res,next)=>{

	let query = Model.findById(req.params.id)

	if (popOptions) query = query.populate(popOptions)

	const doc = await query;

	res.status(200).json({
		status:'success',
		data: {
			data: doc
		}
	})
})

exports.getAll = Model => catchAsync(async (req,res,next)=>{

	// to allow for nested Get Reviews on tour
	let filter = {}
	if (req.params.tourId) filter = {tour: req.params.tourId}


	const features = new APIFeatures(Model.find(filter),req.query)
		.filter()
		.sort()
		.limitFeilds()
		.paginate()


	const doc = await features.query//.explain(); // explain gives you informatoin about the query how many searches results etc.

	// SEND RESPONCE
	res.status(200).json({
		status:'success',
		results: doc.length,
		data: {
			doc
		}
	})
})