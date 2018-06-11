var express = require('express'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    jwt = require('jwt-simple')
// socket = require('socket.io')

var User = require('./models/User'),
    auth = require('./auth'),
    fs = require('fs'),
    CONS = require('./shared/constants'),
    nodeMailer = require('nodemailer')
// Feedback = require('./models/Feedback'),
// Messages = require('./models/Messages'),
// Hero = require('./models/Hero'),

mongoose.Promise = Promise

var app = express(),
    port = process.env.PORT || CONS.constants.port,
    // TODO: CHANGE TO 3.0!!!!!!!
    mongoString = CONS.constants.mongoString

app.use(cors())
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())
app.use(morgan('dev'))

// -------------------- EJS ---------------------------
app.set('view engine', 'ejs');
app.use(express.static('public'));

// -------------------- SENDING E-MAILS ---------------------------

app.post('/send-email', function (req, res) {
    let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'family.tree.poland@gmail.com',
            pass: 'MajBiznes'
        }
    });

    let mailOptions = {
        from: '"Family Tree" <family.tree.poland@gmail.com>', // sender address
        to: req.body.to, // list of receivers
        subject: req.body.subject, // Subject line
        // text: req.body.body // plain text body
        html: `<h2>Welcome ${req.body.to}!</h2>
                <p>Please confirm your account by hit link below</p>
                <br/>
                <br/>
                <div>${req.body.body}</div>` // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        res.send(`Message ${info.messageId} sent.  ${info.response}.`);
        res.send('hi! everything in FamilyTree 3.0 API is working great!')
        // res.render('index');
    });
});

// ----------------------------------------------------------------------------------------------------
// ------------------------------ REQUESTS ------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
app.get('/', (req, res) => {
    // res.render('index');
    res.send('hi! everything in FamilyTree 3.0 API is working great!')
})

// -------------------- USERS ---------------------------
app.get('/users', async (req, res) => {
    try {
        var users = await User.find({}, '-pass -__v')
        // var users = await User.find({}, '-pass -__v')
        res.send(users)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.get('/user/:email', async (req, res) => {
    let email = req.params.email
    try {
        var user = await User.findOne({
            email: email
        }, '-pass -__v')
        // var users = await User.find({}, '-pass -__v')
        res.send(user.name)
    } catch (error) {
        console.error(error)
        res.send({
            message: 'No such a user'
        })
    }
})

// ------------------- confirmed ----------------------
app.get('/confirmed/:email', async (req, res) => {
    let email = req.params.email
    try {
        var user = await User.findOne({
            email: email
        }, '-pass -__v')
        // if (user) {
            if (user.confirmed)
                res.send(true)
            else
                res.send(false)
        // }
    } catch (error) {
        console.error(error)
        res.send({
            message: 'No such a user'
        })
    }
})


// -------------------- VOTE ---------------------------
app.get('/vote/:email', async (req, res) => {
    let email = req.params.email
    // console.log(email)
    let user = await User.findOne({
        email: email
    })

    if(!user) {
        return res.status(400)
            .send({ message: 'No such a (l)user... ;)' })
    }

    return res.status(200)
        .send({
            user: user.email,
            vote: user.vote,
            voteComment: user.voteComment
        })
})

app.put('/vote', async (req, res) => {
    var voteData = req.body;
    console.log(voteData)

    // in case of no found email....
    // try {

    // } catch (error) {

    // }
    var user = await User.findOne({
        email: voteData.email
    })

    if (!user)
        return res.status(401)
            .send({
                message: 'Email or Password invalid!',
                email
            })

    user.vote = voteData.vote
    user.voteComment = voteData.voteComment

    // user.vote.push({
    //     vote: voteData.vote,
    //     comment: voteData.voteComment
    // })
    // console.log(user.loggedIn)
    user.save((err, newLog) => {
        console.log('success - voted => ', user.vote)
    })

    let choice = null;
    if (user.vote.vote === true)
        choice = 'liked'
    else
        choice = 'disliked'

    return res.status(200)
        .send({
            message: 'Voted.',
            value: user.vote,
            choice
        })
})

// ----------------------------------------------------------------------------------------------------
// ------------------------------> /AUTH <------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
app.use('/auth', auth.router)

// -------------------- MONGOOSE & SERVER --------------
mongoose.connect(mongoString, (err) => {
    let _name = mongoString.split('/'),
        dbName = _name[_name.length - 1]
    if (!err)
        console.log(` ===> connected to mLab db: ${dbName} <===`)
})

var server = app.listen(port, () => {
    console.log(` ===> server is listening at =====> port ${port}`)
});