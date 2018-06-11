var mongoose = require('mongoose'),
    bcrypt = require('bcrypt-nodejs')

var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    pass: String,
    plainPass: String,
    admin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    loggedIn: {
        type: Array,
        default: []
    },
    notLoggedIn: {
        type: Array,
        default: []
    },
    vote: String,
    voteComment: String,
    photo: String,
    permissions: {
        type: Array,
        default: []
    },
    temporaryToken: String
})

userSchema.pre('save', function(next) {
    var user = this,
    salt = null,
    counter = 1,
    progress = (err, progress) => {
        process.stdout.write(`. `);
        counter++;
    }

    // means: if password is different
    if (!user.isModified('pass'))
        return next()

    bcrypt.hash(user.pass, salt, progress, (err, hash) => {
        if(err) return next(err)

        
        // console.log(counter)
        // console.log(hash)

        user.pass = hash
        console.log('user.pass', user.pass)
        next()
    })
})

module.exports = mongoose.model('User', userSchema)