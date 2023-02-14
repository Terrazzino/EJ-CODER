const mongoose = require ('mongoose')


const userModel = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

const UserModel = mongoose.model('usuarios', userModel)

module.exports = UserModel