async function processPayment(amount, currency, user) {

  // Simulate delay for processing 
  await new Promise((resolve) => setTimeout(resolve, 2000));


  const transactionId = 'txn_' + Math.random().toString(36).substring(2, 12);

  return {
    transactionId,
    amount,
    currency,
    user: user || 'anonymous',
    status: 'success',
    message: `Charged ${amount} ${currency}`,
  };
}

module.exports = { processPayment };