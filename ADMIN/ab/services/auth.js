const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");

const models = require('../models/index');

module.exports = {
    verifyUser: function (token) {  //<--- receive JWT token as parameter
        try {
            let decoded = jwt.verify(token, 'secretkey'); //<--- Decrypt token using same key used to encrypt
            return models.users.findByPk(decoded.UserId); //<--- Return result of database query as promise
        } catch (err) {
            console.log(err);
            return null;
        }
    },
    signUser: function(user) {
        const token = jwt.sign(
        {
            Username: user.Username,
            UserId: user.UserId,
            Admin: user.Admin
        },
        'secretkey',
        {
            expiresIn: '1h'
        }
        );
        return token;
    },
    hashPassword: function(plainTextPassword) {
        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(plainTextPassword, salt);
        return hash;
    },
    comparePasswords: function (plainTextPassword, hashedPassword) {
        return bcrypt.compareSync(plainTextPassword, hashedPassword)
    }

};

//module.exports = authService;