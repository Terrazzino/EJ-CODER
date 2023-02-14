const dinamicAction = (nombre) => `/login?username=${nombre}`

document.getElementById('login-form').addEventListener('submit', function (s) {
    s.preventDefault();
    if (this.elements["nombre"].value == "") {
        alert('alerta no se ha ingresado ningun nombre')
    } else {
        this.action = dinamicAction(this.elements["nombre"].value)
        this.submit()
    }
})