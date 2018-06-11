var User = require('./models/User'),
    jwt = require('jwt-simple'),
    bcrypt = require('bcrypt-nodejs'),
    express = require('express'),
    router = express.Router(),
    CONS = require('./shared/constants'),
    nodeMailer = require('nodemailer'),
    fs = require('fs')

let secretString = CONS.secretString,
    port = process.env.PORT || CONS.constants.port,
    serverAddress = CONS.constants.serverAddress,
    domainAddress = CONS.constants.domainAddress

// ------------- API ----------------------

router.post('/register', async (req, res) => {
    var userData = req.body;
    // todo: validation
    console.log(userData)

    var user = new User(userData)

    user.temporaryToken = jwt.encode(
        {sub: user._id}, CONS.constants.secretString)
    console.log('debug', user)
    var _existing = await User.findOne({
        email: userData.email
    })
    // console.log(_existing)

    if (_existing) {
        console.log('This user already exists.')
    return res.status(401)
        .send({
            message: 'This user already exists.'
        })
    }

    // user.loggedIn.push(new Date)
    user.save((err, newUser) => {
        if (err) {
            console.log(`ERROR: ${err}`)
        return res.status(401)
            .send({
                message: 'Error saving the user...'
            })
        }

        createSendToken(res, newUser)

        sender({
            email: user.email, 
            name: user.name, 
            temporaryToken: user.temporaryToken 
        })
    })
})

router.post('/login', async (req, res) => {
    var loginData = req.body;

    var user = await User.findOne({
        email: loginData.email
    })

    if (!user)
        return res.status(401)
            .send({
                message: 'Email or Password invalid!'
            })

    bcrypt.compare(loginData.pass, user.pass, (err, isMatch) => {
        if (!isMatch) {
            let newLog = new Date
            user.notLoggedIn.push(newLog)
            // console.log(user.notLoggedIn)
            user.save((err, newLog) => {
                console.log('false - updated notLoggedIn.')
            })
            return res.status(401)
                .send({
                    message: 'Email or Password invalid!'
                })
        }
        // if (isMatch) :)
        let newLog = new Date
        user.loggedIn.push(newLog)
        // console.log(user.loggedIn)
        user.save((err, newLog) => {
            console.log('success - updated loggedIn.')
        })
        createSendToken(res, user)
    })
})

router.put('/activate/:token', async (req, res) => {
    // var activateData = req.body;

    var user = await User.findOne({
        temporaryToken: req.params.token
    })

    if (!user) {
        return res.status(401)
            .send({ message: 'Token invalid!' })
    }

    let token = req.params.token

    let checking = jwt.encode(token, CONS.constants.secretString)
    console.log('checking 4 token: ',checking, token)

    user.temporaryToken = false;
    user.confirmed = true;
    user.save((err, newLog) => {
        console.log('success - activated.')
    })

    return res.status(200)
        .send({
            token,
            message: 'Account activated.'
        })
})

// ------------- functions ----------------------

function sender(mailData) {
    console.log(mailData)
    let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'family.tree.poland@gmail.com',
            pass: 'MajBiznes'
        }
    });
    let receivers = [mailData.email, 'family.tree.poland@gmail.com'],
        activationLink = `${domainAddress}/activate/${mailData.temporaryToken}`
    let emailText = `
            Hello ${mailData.name}, thank you for registering at Family Tree! :)
            Please click on the link below to complete your activation: ${activationLink}
            `
    let emailContent = `
            <h2>Hello ${mailData.name}!</h2>
            <br>
            
            Thank you for registering at Family Tree! :)
            <br>
            <br>
            Please click on the link below to complete your activation: 
            <br>
            <a href='${activationLink}'>Activate</a>
            `
    let email = {
        from: '"Family Tree" <family.tree.poland@gmail.com>',
        to: receivers, // list of receivers
        subject: 'Family Tree Activation Link',
        // text: emailText, // plain text body
        html: emailContent // html body
    };

    transporter.sendMail(email, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log(`Message sent: ${info.response}`)
        res.json({ success: true, message: 'Account created! Please check your e-mail for activation link.'});
        // res.send('hi! everything in FamilyTree 3.0 API is working great!')
            // res.render('index');
        });
}


    
// -------------------- JWT ----------------------
function createSendToken(res, user) {
    // sub = subject => just an id in mongoose terminology
    var payload = {
        sub: user._id
    }
    var token = jwt.encode(payload, CONS.constants.secretString)
    console.log('login successful! token: ', token)

    return res.status(200)
        .send({
            token,
            message: 'Account registered! Please check your e-mail for activation link.'
        })
}

var auth = {
    router,
    checkAuthenticated: (req, res, next) => {
        if (!req.header('authorization'))
            return res.status(401)
                .send({
                    message: 'Unauthorized. Missing Auth Header.'
                })
        var token = req.header('authorization').split(' ')[1]

        // the same secret as in encode!!!!!!!!!!!!!!!!!!!!
        var payload = jwt.decode(token, CONS.constants.secretString)

        if (!payload)
            return res.status(401).send({
                message: 'Unauthorized. Auth Header Invalid.'
            })

        req.userId = payload.sub

        next()
    }
}

module.exports = auth