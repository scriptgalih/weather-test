const cookieParser = require('cookie-parser');
const express = require('express');
var bodyParser = require('body-parser')
const app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false })
const request = require("request");

const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = "41607486630-1emfoce726gl31ul8m17504csj724a0i.apps.googleusercontent.com"
const client = new OAuth2Client(CLIENT_ID);

const PORT = process.env.PORT || 5000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(cookieParser());

app.get('/', (req,res) => {
    res.render('index');
})

app.get('/login', (req,res) => {
    res.render('login');
})

app.post('/login', (req,res) =>{
    let token = req.body.token;
    console.log(token)
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        console.log(payload)
      }
      verify()
      .then(() =>{
          res.cookie('session-token', token);
          res.send('success');
      }).catch(console.error);
})

app.post('/dashboard',urlencodedParser, (req, res) => {
    console.log('Got body:', req.body.location);
    let url = `http://api.openweathermap.org/data/2.5/weather?q=${req.body.location}&units=metric&appid=cedaa8a8f92d98bedc911bb4bed46dd0`;
    request(url, function(err, response, body) {

        // On return, check the json data fetched
        if (err) {
            res.render('index', { weather: null, error: 'Error, please try again' });
        } else {
            let weather = JSON.parse(body);
            console.log(weather.weather[0].main)
            var weather_result = weather.weather[0].main
            var datetime = new Date();

            res.end(`The weather of ${req.body.location} at ${datetime.toISOString().slice(0,10)} is ${weather_result}`)
        }
    });
    // res.end('dashboard')
    // res.sendStatus(200);
});

app.get('/dashboard', checkAuthenticated, (req, res) =>{
    let user = req.user;
    res.render('dashboard',{user})
})

app.get('/protectedRouted', (req, res) =>{
    res.send('protectedroute.ejs')
})

app.get('/logout', (req,res) =>{
    res.clearCookie('session-token');
    res.redirect('/login');
})

function checkAuthenticated(req, res, next){
    let token = req.cookies['session-token'];

    let user = {};
    async function verify(){
        const ticket = await client.verifyIdToken({
            idToken:token,
            audience: CLIENT_ID
            
        });
        const payload = ticket.getPayload();
        user.name = payload.name;
        user.email = payload.email;
        user.picture = payload.picture;
    }
    verify()
    .then(() =>{
        req.user = user;
        next();
    })
    .catch(err=>{
        res.redirect('/login')
    })
}

app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`)
    
})