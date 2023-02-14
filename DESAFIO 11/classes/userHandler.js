const mongoose = require('mongoose')
const userModel = require('../models/userModel.js')
const bcript = require('bcryptjs')

module.exports = class UserHandler {
    constructor(url) {
        this.url = url
    }

    connectDatabase() {
        const connectionParams = {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
        try {
            mongoose.connect(this.url, connectionParams)
        } catch (error) {
            console.log(error)
        }
    }

    async saveUser(email, password) {
        this.connectDatabase()
        const user = await this.findUserByMail(email)
        if (user) {
            return null
        } else {
            var newUser = new userModel
            newUser.email = email
            const encPass = await bcript.hash(password, 10)
            newUser.password = encPass
            newUser.save((err) => {
                if (err) {
                    console.error(err)
                }
            })
        }
    }

    async findUserByMail(email) {
        this.connectDatabase()
        const response = await userModel.findOne({ email: email })
        return response
    }

    async findUserById(id) {
        this.connectDatabase()
        const response = await userModel.findOne({ id: id })
        return response
    }

}