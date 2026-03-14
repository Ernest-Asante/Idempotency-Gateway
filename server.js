require('dotenv').config();
const express = require("express");
const { processPayment } = require("./paymentService");

const app = express();
app.use(express.json());

// Payment endpoint
app.post("/process-payment", async (req, res) => {
  const { amount, currency, user } = req.body;

  try {
    const result = await processPayment(amount, currency, user);
    res.status(201).json(result);
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ error: "Payment processing failed" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});