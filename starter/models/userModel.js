const crypto = require('crypto');
const mongoose = require('mongoose')
const validator = require('validator');
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please tell us name']
	},
	email:{
		type: String,
		required: [true, 'Please provide email'],
		unique: true,
		lowercase: true,
		validator: [validator.isEmail, ' Please provide a valid email']
	},
	role:{
		type: String,
		enum: ['user','guide','lead-guide','admin'],
		default: 'user'
	},
	photo: String,
	password: {
		type: String,
		required: [true,'please provide a pass'],
		minlength: 8,
		select: false
	},
	passwordConfirm:{
		type: String,
		required: [true,'please confirm password'],
		validate: { // This is only work on Create and Save
			validator: function(el){
				return el===this.password		
			}
		},
		select: false
	},
	passwordChangedAt: Date,
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false
	}
})

userSchema.pre('save', async function(next){
	if (!this.isModified('password')) return next(); // If we don't have a modification we just dont do anyhting 
	
	// Hash the password with cost of 12
	this.password = await bcrypt.hash(this.password,11)// The higher the number the more CPU intensive the process will be but it will be more secure

	// Now that we check that is the same we delete the confirmation password
	this.passwordConfirm = undefined
	next();
})

userSchema.pre('save',function(next){
	if (!this.isModified('password') || this.isNew) return next();

	this.passwordChangedAt = Date.now() - 1000;

	next();
})

userSchema.pre(/^find/,function(next){ // everything that starts with find
	this.find({active: { $ne: false}})
	next()
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
	return await bcrypt.compare(candidatePassword,userPassword)
}

userSchema.methods.changesPasswordAfter = async function(JWTTimestamp){
	
	if (this.passwordChangedAt){
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);	

		return JWTTimestamp < changedTimestamp;
	}



	return false;
}

userSchema.methods.createPasswordResetToken = function(){
	
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')


	this.passwordResetExpires = Date.now() + 10*60*1000 // IT will be expired in 10 minutes

	console.log({resetToken},this.passwordResetToken)

	return resetToken
}

const User = mongoose.model('User',userSchema);

module.exports = User;