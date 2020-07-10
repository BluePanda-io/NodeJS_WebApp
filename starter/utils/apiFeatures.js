
class APIFeatures {
	constructor(query,queryString){
		this.query = query;
		this.queryString = queryString
	}

	filter(){
		// BUILD QUERY
		const queryObj = {...this.queryString}
		const excludedFields = ['page','sort','limit','fields'];
		excludedFields.forEach(el =>{
			delete queryObj[el]
		})
		// ADVANCE FILTERING
		let queryStr = JSON.stringify(queryObj);
		queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g,match =>`$${match}`);

		this.query = this.query.find(JSON.parse(queryStr))

		return this;
	}

	sort(){
		if (this.queryString.sort){ // if there is a sort property
			
			const sortBy = this.queryString.sort.split(',').join(' ')
			
			this.query = this.query.sort(sortBy)
		} else {
			this.query = this.query.sort('-createdAt')
		}

		return this;
	}

	limitFeilds(){
		if (this.queryString.fields){
			const fields = this.queryString.fields.split(',').join(' ')
			
			this.query = this.query.select(fields)
		} else{
			this.query = this.query.select('-__v')
		}

		return this
	}

	paginate(){
		//page=2&limit10, page1 = 1-10,page2 = 11-20

		const page = this.queryString.page*1 || 1 // convert to int
		const limit = this.queryString.limit*1 || 100;

		const skip = (page-1)*limit;

		this.query = this.query.skip(skip).limit(limit)

	

		return this;
	}
}


module.exports = APIFeatures