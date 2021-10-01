"use strict";

const { Context } = require("moleculer");
const { settings } = require("moleculer-web");
const { credsAuthenticator } = require("nats");
const DbMixin = require("../mixins/db.mixin");
var dayjs = require('dayjs');
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");
var customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(customParseFormat)


/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */


module.exports = {
    //name: "users",
    // version: 1
    name: "dbDatabase",

    /**
     * Mixins
     */
    mixins: [DbMixin("users")],

    adapter: new SqlAdapter('dbDatabase', 'dbUser', 'dbPassword', {
        host: 'mysql',
        dialect: 'mysql'
    }),

    model: {
        name: "user",
        define: {
            name: Sequelize.STRING,
            birthdate: Sequelize.DATE,
            email: Sequelize.STRING,
            password: Sequelize.STRING,
            createdAt: Sequelize.STRING
        }
    },

    /**
     * Settings
     */
    settings: {
        // Available fields in the responses
        fields: [
            "_id",
            "name",
            "birthdate",
            "email",
            "password",
            "createdAt"
        ],

        // Validator for the `create` & `insert` actions.
        entityValidator: {
            name: "string|min:3",
            email: "email",
            password: "string|min:4",
            birthdate: { type: "string"}

        }
    },

    /**
     * Action Hooks
     */
    hooks: {
        before: {
            /**
             * Register a before hook for the `create` action.
             * It sets a default value for the quantity field.
             *
             * @param {Context} ctx
             */
            create: [
                function addTimestamp(ctx) {
                    ctx.params.createdAt = new dayjs().format('YYYY-MM-DD HH:mm:ss');
                    return ctx;
                },
                function birthdateAdp(ctx) { 
                    const regex = /([0-2][0-9]|(3)[0-1])(\-)(((0)[0-9])|((1)[0-2]))(\-)([0-9][0-9][0-9][0-9])/;
                    console.log(regex.test(ctx.params.birthdate))
                    if(regex.test(ctx.params.birthdate) === true){
                        console.log("AQUI")
                        ctx.params.birthdate = new dayjs(ctx.params.birthdate, 'DD-MM-YYYY').format('YYYY-MM-DD');
                    }else {
                        throw "Birthdate InvalidDate";
                    }
                    console.log(ctx);
                    return ctx;
                }
                
            ],
            update: [
                function addTimestamp(ctx) {
                    ctx.params.updatedAt = new dayjs().format('YYYY-MM-DD HH:mm:ss');
                    return ctx;
                }
            ],
            

        },
        

        error: {
            // Global error handler
            create: [
                function(ctx, err) {
                    console.log("OLHA O ERROOOOO",err)
                    if (err === "Birthdate InvalidDate")
                        err = {
                            type: "Birthdate is invalid",
                            message: "DD-MM-YYYY",
                            actual: ctx.params.birthdate
                        }

                    // err.data.forEach((field, i) => {
                    //     //console.log(err.data[i].field);
                    //     if (err.data[i].field == "birthdate") {
                    //         this.logger.error(`Error occurred when '${ctx.action.name}' action was called`, err);
                    //         err.data[i].expected = "DD-MM-YYYY";
                    //     }

                    // })

                    //console.log(err.data);

                    // Throw further the error
                    throw err;
                }
            ]

        }


    },

    /**
     * Actions
     */
    actions: {

    },

    /**
     * Methods
     */
    methods: {
        /**
         * Loading sample data to the collection.
         * It is called in the DB.mixin after the database
         * connection establishing & the collection is empty.
         */
        async seedDB() {
            await this.adapter.insertMany([
                { name: "José da Silva", birthdate: new dayjs('10-09-1983', 'DD-MM-YYYY').format('YYYY-MM-DD'), email: "Jose.Silva@mail.com", password: "aaaaa", createdAt: new dayjs().format('YYYY-MM-DD HH:mm:ss') },
                { name: "Maria Souza", birthdate: new dayjs('27-11-1994', 'DD-MM-YYYY').format('YYYY-MM-DD'), email: "Maria.Souza@mail.com", password: "aaaaaa", createdAt: new dayjs().format('YYYY-MM-DD HH:mm:ss') },
                { name: "Pedro Santos", birthdate: new dayjs('15-05-2005', 'DD-MM-YYYY').format('YYYY-MM-DD'), email: "Pedro.Santos@mail.com", password: "aaaaa", createdAt: new dayjs().format('YYYY-MM-DD HH:mm:ss') },
            ]);
        }
    },

    /**
     * Fired after database connection establishing.
     */
    async afterConnected() {
        // await this.adapter.collection.createIndex({ name: 1 });
    }
};