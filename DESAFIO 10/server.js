//librerías requeridas
const express = require('express');
const { Server: HttpServer } = require('http')
const { Server: IOServer } = require('socket.io')
const {engine} = require('express-handlebars');
const app = express();
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
app.use(session({
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://francoterrazzino:buscandounamor@cluster0.pjukeal.mongodb.net/?retryWrites=true&w=majority',
        mongoOptions: advancedOptions
    }),
    secret: '587541523569',
    resave: true,
    saveUninitialized: false,
    cookie:
    {
    maxAge: 600000
    }
}))

//servidor
const PORT = 8080
const connectServer = httpServer.listen(PORT, () => console.log(`Servidor http con WebSocket escuchando el puerto ${connectServer.address().port}`))
connectServer.on("error", error => console.log(`Error en servidor ${error}`))

//class
const dBHandler = require("./classes/dbhandler.js")
const chat = new dBHandler(sqLite.options, 'mensajes')
const prod = new dBHandler(mariaDB.options, 'productos')

//"connection" se ejecuta la primera vez que se abre una nueva conexion
io.on('connection', async(socket) => {
    console.log('Nuevo cliente conectado')
    //Envio de los mensajes al cliente que se conecto
    socket.emit('mensajes', await chat.getChat())
    socket.emit('mensaje', await chat.getChat())
    socket.emit('productos', await  prod.getAll())
    socket.emit('producto', await prod.getAll())
    socket.emit('productos-random', await prod.randomProducts())
    //Escucho los mensajes enviados por el cliente
    socket.on('new-message', async(data) => {
        await chat.saveChat(data)
        io.sockets.emit('mensaje', await chat.getChat())
    })
    socket.on('new-producto', async (data) => {
        await prod.saveProduct(data)
        io.sockets.emit('producto', await prod.getAll())
    })
    socket.on('user', async (data) =>{
        await usr.userLogin(data)
        io.sockets.emit('userLogged', await usr.getUser())
    })
})

app.get('/api/productos-test', auth, async(req, res) =>{
    const {cant} = req.query
    res.render('test', {titulo: 'Pruebas de Productos aleatorios', lista: await prod.randomProducts(parseInt(cant))})
})

app.get('/', async(req, res) =>{
    if(req.session.nombre){
        res.render('main', {nombreDeUsuario: req.session.nombre, titulo: 'Engine Handlebars con Websocket', lista: prod.getAll(), mensajes: chat.getAll()})
    } else{
        res.render('login', {titulo: 'Login de usuario'})
    }
})

app.get('/login', (req, res) => {
    const {nombre} = req.query
    req.session.nombre = nombre
    res.render('main', {nombreDeUsuario: req.session.nombre, titulo: 'Engine Handlebars con Websocket', lista: prod.getAll(), mensajes: chat.getAll()})
})

app.get('/logout', (req,res) =>{
    res.render('logout', {usuario: req.session.nombre, titulo: 'cierre de sesión'})
})

app.get('/exit', (req, res)=>{
    req.session.destroy(err => {
        if (!err) res.redirect('/')
        else res.send({ status: 'Logout Error', body: err })
    })
})

function auth (req, res, next) {
    if(req.session?.nombre) {
        return next()
    } else {
        res.redirect('/')
    }

}