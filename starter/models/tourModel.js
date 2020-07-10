const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const User = require('./userModel')

const tourSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'a tour must have name'],
		unique: true,
		trim: true,
		maxlength: [40, "A tour name must have less than 40 char"],
		minlength: [5, "A tour name must have more than 10 char"]
		// validate: [validator.isAlpha,'Tour name mus only contain characters']
	},
	slug: String,
	duration: {
		type: Number,
		required: [true, "A tour must have duration"]
	},
	maxGroupSize: {
		type: Number,
		required: [true, "A tour must have MaxGroupSize"]
	},
	difficulty: {
		type: String,
		required: [true, "A tour must have difficulty "],
		enum: {
			values: ['easy','medium','difficult'],
			message: ' Difficult is either: easy,medium,difficult'
		}

	},
	ratingsAverage: {
		type: Number,
		default: 4.5,
		min: [1, "Rating more than 1.0"],
		max: [5, "Rating less than 1.0"],
		set: val => Math.round(val*100)/100

	},
	ratingsQuantity: {
		type: Number,
		default: 0
	},
	price: {
		type: Number,
		required: [true, 'a tour must have price']
	},
	priceDescount: {
		type: Number,
		validate: {
			validator: function(val){
				return val<this.price
			},
			message: "Discount price should be below regular price"
		}

	},
	summary: {
		type: String,
		required: true,
		required: [true, "A tour mush have a description"]
	},
	description: {
		type: String,
		trim: true
	},
	imageCover: {
		type: String,
		required: [true, "A tour mush have a cover Imge"]
	},
	images: [String],
	createAt: {
		type: Date,
		default: Date.now(),
		select: false
	},
	startDates: [Date],
	secretTour:{
		type: Boolean,
		default: false
	},
	startLocation: {
		//GeoJSON
		type: {
			type: String,
			default: 'Point',
			enum: ['Point']
		},
		coordinates: [Number],
		address: String,
		description: String
	},
	locations: [
		{
			type: {
				type: String,
				default: 'Point',
				enum: ['Point']
			},
			coordinates: [Number],
			address: String,
			description: String,
			day: Number
		}
	],
	guides: [
		{
			type : mongoose.Schema.ObjectId, 
			ref : 'User'
		}
	]
},
{
	toJSON: {virtuals: true},
	toObject: {virtuals: true}
});

tourSchema.index({price: 1}) // This will speed up the search of prices significantly and we do that mainly 
// for the searches that we want to do again and again, 1 it means taht we sort this on an acenting order

tourSchema.index({price: 1,ratingsAverage: -1})
tourSchema.index({slug: 1})

tourSchema.index({startLocation: '2dsphere'})

tourSchema.virtual('durationWeeks').get(function(){
	return this.duration/7
})

// Virtual populate // Which is only used when you have parent referencing so you don't have the informatin of your child in your system and you need to write this code in order to get this viruatl informatoin
tourSchema.virtual('reviews',{
	ref: 'Review', // Tak about the reference from were you are trying to get the information 
	foreignField: 'tour', // Here we answere the question were inside the Review the information that we want to gather is stored, and in this exapmle is inside tour
	localField: '_id' // were the ID is stored in this local feid so in the tourModel in order to combine the two
})


// For embeding (Just for test)
// tourSchema.pre('save', async function(next){
// 	const guidesPromises = this.guides.map(async id => await User.findById(id));

// 	this.guides = await Promise.all(guidesPromises)
// 	next();
// })


tourSchema.pre(/^find/,function(next){ 
	this.populate({
		path: 'guides',
		select: '-__v -passwordChangedAt'

	})

	next()
})
	



// QUERY MIDDLEWARE
tourSchema.pre(/^find/,function(next){ // This means taht all commands that start with find will triger this stamtent 
	this.find({secretTour: {$ne:true}})

	next();
})

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate',function(next){
// 	this.pipeline().unshift({$match: {secretTour: {$ne: true}}})
// 	next();
// })

const Tour = mongoose.model('Tour',tourSchema);

module.exports = Tour