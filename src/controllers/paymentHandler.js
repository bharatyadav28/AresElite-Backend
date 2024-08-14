const catchAsyncError = require("../utils/catchAsyncError");
const mongoose = require("mongoose");
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PlanModel = require("../models/planModel");
const UserModel = require("../models/userModel");
const ServiceModel = require("../models/ServiceTypeModel");
const AppointmentModel = require("../models/appointmentModel");
const TransactionModel = require("../models/transactionModel");

exports.createPaymentIntent = catchAsyncError(async (req, res, next) => {
    const product = req.body.product;
    if (!product) {
        return res.status(404).send({
            success: false,
            message: 'Product not found or not sent!'
        })
    }
    if (product.type === 'planPurchase') {
        const user = await UserModel.findById(product.userId);
        if (user.plan === null) {
            return res.status(400).json({ message: "Did'nt have any plan" });
        }
        if (user.plan_payment !== 'paid') {
            const planCost = await PlanModel.findOne({
                name: user.plan
            });
            const plan = planCost.phases.find(phase => phase.name === user.phase);
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: plan.cost * 100,
                    currency: 'inr',
                    automatic_payment_methods: {
                        enabled: true,
                    },
                });
                res.status(200).send({
                    clientSecret: paymentIntent.client_secret,
                });
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        }
    }
    if (product.type === 'booking') {
        const costForService = async (alias) => {
            let cost;

            if (typeof cost === 'undefined') {
                const service = await ServiceModel.findOne({ alias }).select('+cost');
                if (service) {
                    cost = service.cost;
                }
            }

            return cost || 0;
        };
        const booking = await AppointmentModel.findById(product.bookingId);
        if (!booking)
            return res.status(404).json({
                success: true,
                message: 'Booking not found'
            })
        let cost = await costForService(booking.service_type);

        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: cost * 100,
                currency: 'inr',
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            res.status(200).send({
                clientSecret: paymentIntent.client_secret,
            });
        } catch (error) {
            res.status(500).send({ error: error.message });
        }

    }
});

exports.updatePayment = catchAsyncError(async (req, res) => {
    const { type, userId, bookingId, isPaid } = req.body;
    console.log(type, userId, bookingId, isPaid);
    try {
        if (type === 'planPurchase') {
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const transaction = await TransactionModel.findOne({ clientId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
            if (!transaction) {
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }

            user.plan_payment = isPaid ? 'paid' : 'failed';
            transaction.payment_status = isPaid ? 'paid' : 'failed';

            await user.save();
            await transaction.save();

            res.status(200).json({
                success: true,
                message: 'Updated'
            });

        } else if (type === 'booking') {
            const booking = await AppointmentModel.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ success: false, message: 'Booking not found' });
            }

            const transaction = await TransactionModel.findOne({ bookingId: new mongoose.Types.ObjectId(bookingId) }).sort({ createdAt: -1 });
            if (!transaction) {
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }

            booking.status = isPaid ? 'paid' : 'failed';
            transaction.payment_status = isPaid ? 'paid' : 'failed';

            await booking.save();
            await transaction.save();

            res.status(200).json({
                success: true,
                message: 'Updated'
            });

        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid type'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});