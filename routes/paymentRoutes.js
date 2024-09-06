const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

const apiKey =
  "sk_test_51PTomGP5rx6biLxfhWvdFuyHamSRCWEKkW0S7Gi97ecDfNhrTWpWbpj7BDk91kFRbUSCkiUQnBToMFMOYHSNQZhi00CZoctT8C";

// Ensure the API key is properly set
const stripe = Stripe(apiKey);

// Add a console.log to check if the API key is set
console.log("Stripe API Key set:", !!apiKey);

router.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  console.log("first phase");

  // Add error handling for missing API key
  if (!apiKey) {
    return res.status(500).send({
      error: "Stripe API key is not set in the environment variables.",
    });
  }

  try {
    console.log("second phase");
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({
      error: error.message,
    });
  }
});

module.exports = router;
