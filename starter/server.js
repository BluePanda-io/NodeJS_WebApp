const mongoose = require('mongoose')

const dotenv = require('dotenv')


dotenv.config({path: './config.env'})
const app = require('./app')

const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)//

mongoose.connect(DB,{
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false
}).then(con =>{
	// console.log(con.connections)
	console.log("DB connection succesfull")
})

// console.log("asdf")
// const testTour = new Tour({
// 	name: "The Park Camper",
// 	rating: 4.7,
// 	price: 497
// })

// testTour.save().then(doc =>{
// 	console.log(doc);
// }).catch(err =>{
// 	console.log("error = ",err)
// })



// 4) START THE SERVER
const port = process.env.PORT || 3000; //
const server = app.listen(port,()=>{
	console.log(`app Running on port ${port}...`)
});

process.on('unhandledRejection',err=>{
	console.log(' UNHANDLED REJECTION SUTTING DOWN')
	console.log(err.name,err.message);
	server.close(() =>{
		process.exit(1);//
	})//
	
})

process.on('uncaughtException',err=>{
	console.log(' UNHANDLED EXCEPTION SUTTING DOWN')
	console.log(err.name,err.message);
	server.close(() =>{
		process.exit(1);//
	})//
	
})
