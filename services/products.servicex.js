"use strict";

const { Context } = require("moleculer");
const { settings } = require("moleculer-web");
//const { credsAuthenticator } = require("nats");
const DbMixin = require("../mixins/db.mixin");
var dayjs = require('dayjs');
const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const { Sequelize } = require("sequelize");
const ApiGwService = require("moleculer-web");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const broker = new ServiceBroker();

module.exports = {
    name: "dbDatabase",
}

broker.createService({
    name: "products",
    // version: 1

    /**
     * Mixins
     */
    mixins: [DbMixin("products")],

    adapter: new SqlAdapter('dbDatabase', 'dbUser', 'dbPassword', {
        host: 'mysql',
        dialect: 'mysql'
    }),

    model: {
        name: "post",
        // define: {

        // }
    },

    /**
     * Settings
     */
    settings: {
        // Available fields in the responses
        fields: [
            "_id",
            "name",
            "quantity",
            "price",
            "stars",
        ],

        // Validator for the `create` & `insert` actions.
        entityValidator: {
            name: "string|min:3",
            price: "number|positive",
            stars: "number|positive|min:1|max:5",
        },

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
                    // Add timestamp
                    ctx.params.createdAt = new dayjs().format('YYYY-MM-DD HH:mm:ss');
                    return ctx;
                }
            ],
            update: [
                function addTimestamp(ctx) {
                    // Add timestamp
                    ctx.params.updatedAt = new dayjs().format('YYYY-MM-DD HH:mm:ss');
                    return ctx;
                }
            ]
        },

    },

    /**
     * Actions
     */
    actions: {
        /**
         * The "moleculer-db" mixin registers the following actions:
         *  - list
         *  - find
         *  - count
         *  - create
         *  - insert
         *  - update
         *  - remove
         */

        // --- ADDITIONAL ACTIONS ---

        /**
         * Increase the quantity of the product item.
         */
        increaseQuantity: {
            rest: "PUT /:id/quantity/increase",
            params: {
                id: "string",
                value: "number|integer|positive"
            },
            async handler(ctx) {
                const doc = await this.adapter.updateById(ctx.params.id, { $inc: { quantity: ctx.params.value } });
                const json = await this.transformDocuments(ctx, ctx.params, doc);
                await this.entityChanged("updated", json, ctx);

                return json;
            }
        },

        /**
         * Decrease the quantity of the product item.
         */
        decreaseQuantity: {
            rest: "PUT /:id/quantity/decrease",
            params: {
                id: "string",
                value: "number|integer|positive"
            },
            /** @param {Context} ctx  */
            async handler(ctx) {
                const doc = await this.adapter.updateById(ctx.params.id, { $inc: { quantity: -ctx.params.value } });
                const json = await this.transformDocuments(ctx, ctx.params, doc);
                await this.entityChanged("updated", json, ctx);

                return json;
            }
        },

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
                { name: "Samsung Galaxy S10 Plus", quantity: 10, price: 704, stars: 3 },
                { name: "iPhone 11 Pro", quantity: 25, price: 999, stars: 3 },
                { name: "Huawei P30 Pro", quantity: 15, price: 679, stars: 3 },
                { name: "Samsung Galaxy A50", quantity: 10, price: 620, stars: 3 },
            ]);
        }
    },

    /**
     * Fired after database connection establishing.
     */
    async afterConnected() {
        // await this.adapter.collection.createIndex({ name: 1 });
    }
});


// broker.start()
//     // Create a new post
//     .then(() => broker.call("dbDatabase.create", {

//     }))

// // Get all posts
// .then(() => broker.call("dbDatabase.find").then(console.log));