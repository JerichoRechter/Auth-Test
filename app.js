
//Setup
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const app=express();
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy=require("passport-google-oauth20").Strategy;
const findOrCreate=require("mongoose-findorcreate");
require('dotenv').config();
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret:"HiSecretImDad",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

///WARNING THE CODE LINE BELOW IS MY OWN DATABASE, AND WILL MOST LIKELY WORK ONLY IN MY COMPUTER.
///EDIT THE LINE BELOW TO YOUR DATABASE OR IT WILL NOT WORK!!! (MEFKA)
mongoose.connect("mongodb://localhost:27017/usersDB",{useNewUrlParser:true});

//end of setup

//mongo schema
const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  googleId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User= new mongoose.model("User",userSchema);
//serialization
passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileUrl:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



//home page
app.get("/",function(req,res){
  res.render("home")
});

//authentication PAGE
app.get("/auth/google",passport.authenticate("google",{scope:['profile']}));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });



//LOGIN PAGE
app.get("/login",function(req,res){
  res.render("login")
});

///actually login people
app.post("/login",function(req,res){
  const user=new User({
    username: req.body.username,
    password :req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
    } else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });

});


//REGISTER PAGE
app.get("/register",function(req,res){
  res.render("register")
});
///register people
app.post("/register",function(req,res){
  User.register({username: req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("register")
    } else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });

});

//secrets page
app.get("/secrets",function(req,res){
  if (req.isAuthenticated()){
    res.render("secrets");
  } else{
    res.redirect("/login");
  }

});

//logout page
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/")
});


//submit page
app.get("/submit",function(req,res){
  res.render("submit")
});





//server starter
app.listen(3000,function(){
  console.log("Server started on port 3000")
});
