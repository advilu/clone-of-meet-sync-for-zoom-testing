const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../models');
const keys = require('../config/config');

// for everything that uses mongoose model classes
// we are not going to use require statements
// the reason is
// whenever you use mongoose inside of a testing environment
// sometimes your model files will be required into the project multiple times
//  mongoose will get confused when that happens and it will think
// you're attempting to load in multiple models called users
// and then it will throw an error saying
// "you already loading in something called users before"

//
// const User = mongoose.model('User');

// this sets an identifying token that says you are without a doubt
// the user that logged in
passport.serializeUser((user, done) => {
    // the 1st param passed to done is always the error object.
    // the id in the 2nd param is not the profile.id
    // this id is the id being assigned by mongo
    // the reason we do this instead of profile id is because
    // when we use other strategies like Twitter or Facebook
    // we can't assume that they will have a google id
    // so we use the one assigned by mongo

    // this sets the user.id as the cookie
    done(null, user.id);
});

// takes the id that we stuffed in the cookie from serialize and turn it back into a user model
passport.deserializeUser(async (id, done) => {
    console.log("Inside deserializeUser", id)
    const user = await db.User.findOne({
        where: {
            id: id
        }
    });
    // console.log(user)
    done(null, user);
});

// Tells passport to use a google strategy and what credentials
// and function to run when the strategy is used

// The second parameter is the function that fires every time the user gets redirected
// back to our app after they sign in
passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        console.log(profile)
        const existingUser = await db.User.findOne({
            where: {
                googleId: profile.id
            }
        });

        if (existingUser) {
            // the user passed in both done function will become
            // the same user being passed into passport.serializeUser
            console.log(existingUser)
            done(null, existingUser);
        } else {
            const user = await db.User.create({ 
                googleId: profile.id, 
                name: profile.name.givenName 
            });
            done(null, user);
        }
    })
);