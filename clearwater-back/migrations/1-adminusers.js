'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "adminusers", deps: []
 * createTable "cwCustomers", deps: []
 *
 **/

var info = {
    "revision": 1,
    "name": "adminusers",
    "created": "2023-07-09T18:19:06.130Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "adminusers",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "cwCustomers",
            {

            },
            {}
        ]
    }
];

module.exports = {
    pos: 0,
    up: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            function next() {
                if (index < migrationCommands.length)
                {
                    let command = migrationCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
                    index++;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                }
                else
                    resolve();
            }
            next();
        });
    },
    info: info
};
