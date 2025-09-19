const Stripe = require("stripe");

module.exports.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
