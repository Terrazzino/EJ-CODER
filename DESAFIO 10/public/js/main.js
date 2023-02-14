//normalizr
const normalize = normalizr.normalize;
const denormalize = normalizr.denormalize;
const schema = normalizr.schema;

const socket = io.connect()

const input = document.getElementById('inputSocket')
const main = document.getElementById('parrafo')
const boton = document.getElementById('btn')
const celdasProductos = document.getElementById('products-container')
const celdasProductosR = document.getElementById('products-container-r')
const compressionRatio = document.getElementById('compression')

// Escucho los mensajes enviados por el servidor
socket.on('mensaje', messages => {
    const data = JSON.parse(messages)

    //se toman los datos (const data) y se denormalizan para ser representados en el sitio
    const author = new schema.Entity('authors',{},{
        idAttribute: "id"
    })
    const mensaje = new schema.Entity('mensajes',{
        author: author,
    })
    const chat = new schema.Entity('chat', {
        mensajes: [mensaje]
    })
    const denormalizedData = denormalize(data.result, chat, data.entities)

    const rawDataSize = JSON.stringify(denormalizedData).length
    const compDataSize = messages.length

    const percent = (compDataSize * 100) / rawDataSize


    const mensajeCompresion = `Mensajes (compresión: %${percent.toFixed(0)})`
    compressionRatio.innerHTML = mensajeCompresion

    const mensajesHTML = denormalizedData.mensajes
        .map(msj => `
        <div class="message-cont">
        <div class="messenger">
        <div class="avatar-container"><img class="avatar-img"src="${msj.author.avatar}"></div>
        <div class="messenger-card">
        <div class="messenger-alias">Alias: ${msj.author.alias}</div>
        <div class="messenger-alias">Email: ${msj.author.id}</div>
        </div>
        </div>
        <div class="mensaje">Mensaje: ${msj.text}</div>
        </div>
        `).join('')
    main.innerHTML = mensajesHTML
})

socket.on('producto', productos => {
        const productosHTML = productos
        .map(pro => `
        <tr class="tr2">
        <td class="td1">${pro.title}</td>
        <td class="td2">${pro.price}</td>
        <td class="td3"><img src="${pro.thumbnail}"></td>
        </tr>`)
        .join('')
    celdasProductos.innerHTML = productosHTML
})

socket.on('productos-random', productos =>{
    const productosHTML = productos
    .map(pro =>`
    <tr class="tr2">
    <td class="td1">${pro.title}</td>
    <td class="td2">${pro.price}</td>
    <td class="td3"><img src="${pro.thumbnail}"></td>
    </tr>`)
    .join('')
    celdasProductosR.innerHTML = productosHTML
})

//Envio de los mensajes al servidor
function addMessage() {
    const email = document.getElementById('email').value;
    const nombre = document.getElementById('name').value;
    const apellido = document.getElementById('apellido').value;
    const edad = document.getElementById('edad').value;
    const alias = document.getElementById('alias').value;
    const thumbnail = document.getElementById('thumbnail-chat').value;
    const text = document.getElementById('texto').value;
    const mensaje = {
        "author": {
            "id": email,
            "nombre": nombre,
            "apellido": apellido,
            "edad": edad,
            "alias": alias,
            "avatar": thumbnail,
        },
        "text": text
    }
    if(email == ""){
        return(alert('Debe ingresar un email para enviar un mensaje'));
    } else if(nombre == "") {
        return(alert('Debe ingresar un nombre para enviar un mensaje'));
    } else if (apellido == "") {
        return(alert('Debe ingresar un apellido para enviar un mensaje'));
    } else if(edad == "") {
        return(alert('Debe ingresar tu edad para enviar un mensaje'));
    } else if (alias == "") {
        return(alert('Debe ingresar un alias para enviar un mensaje'));
    } else if (thumbnail == "") {
        return(alert('Debe ingresar una url Avatar para enviar un mensaje'));
    } else if (text == "") {
        return(alert('por favor ingrese un mensaje para enviarlo'));
    } else {
        socket.emit('new-message', mensaje);
        return(alert('mensaje enviado satisfactoriamente'));
    }
}

function addProducto (e) {
    const producto= {
        title: document.getElementById('title').value,
        price: document.getElementById('price').value,
        thumbnail: document.getElementById('thumbnail').value
    };
    socket.emit('new-producto', producto);
    return(false);
}