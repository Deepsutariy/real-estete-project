const express = require('express')
require('dotenv').config({ path: './config/.env' })
const http = require('http');
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const cors = require('cors')
const Emitter = require('events')
const passport = require('passport')
var mung = require('express-mung');
const { checkSessionExpiration } = require('./public/partials/utils')
//importing the routes
const userRouter = require('./app/routes/user.route')
const adminAgencyRouter = require('./app/routes/admin_Agency_router')
const admin_router = require('./app/routes/admin_router')

//initializing the port
const PORT = process.env.PORT || 3000

//creating the server
const app = express()

// Event emitter(for updating child)
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)

app.set("view engine", "html");

//socket.io config
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", } })

//render image from public directory
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(cors({ origin: true, credentials: true }));
app.use(express.urlencoded({ extended: false }))

//parse the data from the request
app.use(express.json())

// Database connection
require('./config/mongodb')

//passport config
app.use(passport.initialize())
require('./config/passport')


//parse cookies
app.use(cookieParser());
var bodyParser = require('body-parser');

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
         


//accessing the routes
app.use(userRouter);
app.use(adminAgencyRouter);
app.use(admin_router);

//Expire user session 
checkSessionExpiration()

//default route
app.all('*', (req, res) => {
    return res.status(404).send("URL not found")
})

//listening the server
server.listen(PORT, () => {
    console.log('server is running on port ' + PORT)
})