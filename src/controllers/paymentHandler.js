const catchAsyncError = require("../utils/catchAsyncError");
const mongoose = require("mongoose");
const Stripe = require("stripe");
const stripe = Stripe(process.env.SECRET);
const PlanModel = require("../models/planModel");
const UserModel = require("../models/userModel");
const ServiceModel = require("../models/ServiceTypeModel");
const AppointmentModel = require("../models/appointmentModel");
const TransactionModel = require("../models/transactionModel");
const OfflineAtheleteDrillsModel = require("../models/OfflineAtheleteDrills");
const TeleSessionsModel = require("../models/TeleSessionsModel");
const transactionModel = require("../models/transactionModel");
const moment = require("moment"); // To handle date calculations
const ErrorHandler = require("../utils/errorHandler");

exports.createPaymentIntent = catchAsyncError(async (req, res, next) => {
  const { product } = req.body;
  const { type, userId, phaseName, transactionId } = product; // Added phaseName
  const userid = req.userId;
  const id = userId || userid;

  try {
    // Retrieve the user from the database
    const user = await UserModel.findById(id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    let customer;
    if (!user.stripeCustomerId) {
      // Create a new Stripe customer if not present
      customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        address: {
          line1: user.address,
          postal_code: user.zip,
          city: user.city,
          state: user.state,
          country: "India" || "Canada",
        },
        payment_method: "pm_card_visa",
        invoice_settings: {
          default_payment_method: "pm_card_visa", // Set the default payment method
        },
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    } else {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    }

    let paymentIntent;

    if (type === "planPurchase") {
      const transaction = await TransactionModel.findById(transactionId);

      if (!transaction) {
        return next(new ErrorHandler("Transaction not found", 404));
      }
      const plan = await PlanModel.findOne({ name: user.plan });
      if (!plan) {
        return res
          .status(400)
          .json({ success: false, message: "Plan not found" });
      }

      const phase = plan.phases.find((p) => p.name === phaseName);
      if (!phase) {
        return res
          .status(400)
          .json({ success: false, message: "Phase not found" });
      }

      console.log("Phase:", phase); // Log the phase details

      const upfrontAmount = phase.cost; // Assuming this is for the initial upfront charge (e.g., for 3 or 6 months)

      // Step 1: Create an upfront payment intent to charge the user for the initial duration
      console.log("Creating upfront payment intent for initial charge...");
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: upfrontAmount * 100, // Convert to the smallest currency unit
          currency: "inr", // Adjust currency as needed
          customer: customer.id,
          payment_method: "pm_card_visa", // Replace with a valid payment method ID
          off_session: true,
          confirm: true,
          description: `Upfront charge for ${phase.duration} months`,
        });

        console.log("Upfront payment intent created:", paymentIntent);
      } catch (error) {
        console.error("Error creating upfront payment intent:", error);
        return res
          .status(500)
          .json({
            success: false,
            message: "Error creating upfront payment intent",
          });
      }

      // Step 2: Create the recurring subscription starting after the initial duration
      console.log("Proceeding to create the recurring subscription...");
      try {
        // Create a product for the subscription
        const product = await stripe.products.create({
          name: `${plan.name} - ${phaseName}`,
          description: `Subscription for ${plan.name}, ${phaseName}`,
        });

        // Create a recurring price
        const price = await stripe.prices.create({
          unit_amount: phase.cost * 100, // Monthly cost
          currency: "inr",
          recurring: { interval: "month" },
          product: product.id,
        });

        // Calculate trial end date (3 or 6 months from now)
        const trialEndDate =
          Math.floor(Date.now() / 1000) + phase.duration * 30 * 24 * 60 * 60; // Current time + duration in seconds

        // Create the subscription with trial end set
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [
            {
              price: price.id, // Use the recurring price ID
            },
          ],
          billing_cycle_anchor: Math.floor(Date.now() / 1000), // Start billing immediately
          trial_end: trialEndDate, // Delay the first billing until the trial ends
          proration_behavior: "none",
          expand: ["latest_invoice.payment_intent"],
        });

        let subscriptionId = subscription ? subscription.id : null;

        transaction.subscriptionId = subscriptionId;
        user.stripeSubscriptionId = subscriptionId;
        await transaction.save();
        await user.save();
        console.log("Subscription created with trial end:", subscription);

        // Return a success response
        return res.status(200).json({
          success: true,
          message:
            "Upfront payment made, subscription created successfully with delayed billing.",
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Error creating recurring subscription:", error);
        return res
          .status(500)
          .json({
            success: false,
            message: "Error creating recurring subscription",
          });
      }
    } else if (type === "trainingSession") {
      const costForService = async (tId) => {
        let cost;
        if (typeof cost === "undefined") {
          const service = await TrainingSessionModel.findById(tId).select(
            "+cost"
          );
          console.log(tId, TrainingSessionModel);
          if (service) {
            cost = service.cost;
          }
        }

        return cost || 0;
      };

      const transaction = await TransactionModel.findById(product.tId);
      if (!transaction)
        return res.status(404).json({
          success: true,
          message: "Transaction not found",
        });
      console.log("tran", transaction);
      let cost = await costForService(transaction.plan);

      // Handle training session payment
      paymentIntent = await stripe.paymentIntents.create({
        amount: cost * 100, // Use the calculated cost
        currency: "inr",
        customer: customer.id,
        payment_method: "pm_card_visa",
        off_session: true,
        confirm: true,
        description: "Training Session Booking",
      });
    } else if (type === "booking") {
      // Handle booking payments here
      const costForService = async (alias) => {
        let cost;

        if (typeof cost === "undefined") {
          const service = await ServiceModel.findOne({ alias }).select("+cost");
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
          message: "Booking not found",
        });
      let cost = await costForService(booking.service_type);

      // Handle booking payment
      paymentIntent = await stripe.paymentIntents.create({
        amount: cost * 100, // Use the calculated cost
        currency: "inr",
        customer: customer.id,
        payment_method: "pm_card_visa",
        off_session: true,
        confirm: true,
        description: "Service Booking",
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product type" });
    }

    console.log("Payment Intent:", paymentIntent); // Log the payment intent

    // Check if paymentIntent is defined
    if (!paymentIntent) {
      return res
        .status(400)
        .json({ success: false, message: "Payment intent creation failed" });
    }

    // Respond with the payment intent client secret
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error in createPaymentIntent:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.updatePayment = catchAsyncError(async (req, res) => {
  const { type, userId, bookingId, isPaid } = req.body;
  console.log(type, userId, bookingId, isPaid);
  try {
    if (type === "planPurchase") {
      const user = await UserModel.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const transaction = await TransactionModel.findOne({
        clientId: new mongoose.Types.ObjectId(userId),
        service_type: "planPurchase",
      }).sort({ createdAt: -1 });
      if (!transaction) {
        return res
          .status(404)
          .json({ success: false, message: "Transaction not found" });
      }

      console.log("transaction", transaction);

      user.plan_payment = isPaid ? "paid" : "failed";
      transaction.payment_status = isPaid ? "paid" : "failed";

      await user.save();
      await transaction.save();

      if (user?.is_online || false) {
        await OfflineAtheleteDrillsModel.create({
          client: new mongoose.Types.ObjectId(userId),
          appointment: new mongoose.Types.ObjectId(bookingId),
          numOfSessions: 2,
        });

        const result = await TeleSessionsModel.create({
          user: new mongoose.Types.ObjectId(userId),
          count: 2,
        });
        console.log("Result: ", result);
      }

      res.status(200).json({
        success: true,
        message: "Updated",
      });
    } else if (type === "booking") {
      const booking = await AppointmentModel.findById(bookingId);
      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }

      const transaction = await TransactionModel.findOne({
        bookingId: new mongoose.Types.ObjectId(bookingId),
      }).sort({ createdAt: -1 });
      if (!transaction) {
        return res
          .status(404)
          .json({ success: false, message: "Transaction not found" });
      }
      console.log("ispaid", isPaid);

      booking.status = isPaid ? "paid" : "failed";
      transaction.payment_status = isPaid ? "paid" : "failed";

      await booking.save();
      await transaction.save();

      res.status(200).json({
        success: true,
        message: "Updated",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid type",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.cancelTransactionWithStripe = catchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;

    console.log("idd", id);
    try {
      // Find the transaction by ID
      const transaction = await transactionModel.findById(id);

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Check if the transaction is for a subscription
      if (!transaction.subscriptionId) {
        return next(
          new ErrorHandler(
            `No subscription associated with this transaction`,
            500
          )
        );
      }

      // Retrieve the subscription from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        transaction.subscriptionId
      );

      // Check if the subscription is still in the trial period
      const trialEnd = stripeSubscription.trial_end
        ? moment.unix(stripeSubscription.trial_end)
        : null;

      if (trialEnd && trialEnd.isAfter(moment())) {
        return next(
          new ErrorHandler(
            `You cannot cancel the subscription before ${trialEnd.format(
              "MM-DD-YYYY"
            )}`,
            500
          )
        );
      }

      // Check the phase duration and allow cancellation only after 3/6 months
      const currentDate = moment();
      const transactionStartDate = moment(transaction.createdAt); // Assuming createdAt is the start of the subscription

      let allowedCancellationPeriod;

      // Set allowed cancellation period based on the transaction phase or plan
      if (transaction.phase === "Basic") {
        allowedCancellationPeriod = 3; // Basic phase (Novice) - 3 months duration
      } else {
        allowedCancellationPeriod = 6; // Other phases - 6 months duration
      }

      // Check if the time difference is less than the allowed cancellation period
      const monthsElapsed = currentDate.diff(transactionStartDate, "months");
      if (monthsElapsed < allowedCancellationPeriod) {
        return next(
          new ErrorHandler(
            `Cancellation is only allowed after ${allowedCancellationPeriod} months from the phase start date.`,
            500
          )
        );
      }

      // Cancel the Stripe subscription
      const canceledSubscription = await stripe.subscriptions.cancel(
        transaction.stripe_subscription_id
      );

      // Update the transaction's status to canceled
      transaction.payment_status = "canceled";
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: `Transaction and subscription ${transactionId} have been canceled successfully.`,
        transaction,
        stripeResponse: canceledSubscription,
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      return res
        .status(500)
        .json({ error: "Failed to cancel the subscription" });
    }
  }
);
