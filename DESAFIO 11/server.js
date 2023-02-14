//variables de entorno
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}

//librerías requeridas
const express = require('express');
const app = express();
const { Server: HttpServer } = require('http')
const { Server: IOServer } = require('socket.io')
const { engine } = require('express-handlebars');
const passport = require('passport')
const flash = require('express-flash')

const httpServer = new HttpServer(app)
const io = new IOServer(httpServer)

//sesiones
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true }

const mariaDB = require('./options/mariaDB.js');
const sqLite = require('./options/sqLite.js')

//engine handlebars
app.engine('hbs', engine({
    defaultLayout: false
}))

//middlewares
app.set("view engine", "hbs");
app.set("views", "./views")
app.use(express.static('public'))
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://francoterrazzino:buscandounamor@cluster0.pjukeal.mongodb.net/?retryWrites=true&w=majority',
        mongoOptions: advancedOptions
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie:
    {
        maxAge: 600000
    }
}))
app.use(passport.initialize())
app.use(passport.session())

//servidor
const PORT = 8080
const connectServer = httpServer.listen(PORT, () => console.log(`Servidor http con WebSocket escuchando el puerto ${connectServer.address().port}`))
connectServer.on("error", error => console.log(`Error en servidor ${error}`))

//conexion a mongoDb
const { mongoUrl } = require('./config/connections.js')

//class
const userHandler = require('./classes/userHandler.js')
const dBHandler = require("./classes/dbhandler.js")
const chat = new dBHandler(sqLite.options, 'mensajes')
const prod = new dBHandler(mariaDB.options, 'productos')
const usr = new userHandler(mongoUrl)

//"connection" se ejecuta la primera vez que se abre una nueva conexion
io.on('connection', async (socket) => {
    console.log('Nuevo cliente conectado')
    //Envio de los mensajes al cliente que se conecto
    socket.emit('mensajes', await chat.getChat())
    socket.emit('mensaje', await chat.getChat())
    socket.emit('productos', await prod.getAll())
    socket.emit('producto', await prod.getAll())
    socket.emit('productos-random', await prod.randomProducts())
    //Escucho los mensajes enviados por el cliente
    socket.on('new-message', async (data) => {
        await chat.saveChat(data)
        io.sockets.emit('mensaje', await chat.getChat())
    })
    socket.on('new-producto', async (data) => {
        await prod.saveProduct(data)
        io.sockets.emit('producto', await prod.getAll())
    })
})

//passport
const initializePassport = require('./config/passport.js')
initializePassport(
    passport,
    email => usr.findUserByMail(email),
    id => usr.findUserById(id),
)

app.get('/api/productos-test', auth, async (req, res) => {
    const { cant } = req.query
    res.render('test', { titulo: 'Pruebas de Productos aleatorios', lista: await prod.randomProducts(parseInt(cant)) })
})

app.get('/', auth, async (req, res) => {
    res.render('main', { email: req.user.email, titulo: 'Pagina principal', lista: prod.getAll(), mensajes: chat.getAll() })

})

app.get('/login', notAuth, (req, res) => {
    res.render('login', { titulo: 'Login de usuario' })
})

app.post('/login', notAuth, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))


app.get('/register', notAuth, (req, res) => {
    res.render('register', { titulo: 'Registro de usuario nuevo' })
})

app.post('/register', notAuth, async (req, res) => {
    if (usr.findUserById(req.body.email)) {
        res.render('register', { titulo: 'Registro de usuario nuevo', error: 'El usuario ya existe' })
    } else {
        try {
            usr.saveUser(req.body.email, req.body.password)
            res.redirect('/login')
        } catch {
            res.redirect('/register')
        }
    }
})

app.get('/logout', auth, (req, res) => {
    res.render('logout', { usuario: req.user.email, titulo: 'cierre de sesión' })
})

app.get('/exit', auth, (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    })
})

function auth(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    } else {
        return res.redirect('/login')
    }

}

function notAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    return next()
}