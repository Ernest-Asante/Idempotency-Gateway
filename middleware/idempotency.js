const crypto = require("crypto");
const store = require("../idempotencyStore");

// in-memory rate limiter
const rateLimiter = new Map();
const MAX_RETRIES = 5;
const WINDOW = 60 * 1000;

function hashBody(body) {
  return crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

module.exports = async function (req, res, next) {
  const key = req.headers["idempotency-key"];
  if (!key)
    return res.status(400).json({ error: "Idempotency-Key header required" });

  // Rate limiting per key implementation

  const now = Date.now();
  const limiter = rateLimiter.get(key);

  if (limiter) {
    if (now - limiter.firstRequestTime < WINDOW) {
      if (limiter.count >= MAX_RETRIES) {
        return res
          .status(429)
          .json({ error: "Too many retries for this idempotency key" });
      }
      limiter.count++;
    } else {
      rateLimiter.set(key, { count: 1, firstRequestTime: now });
    }
  } else {
    rateLimiter.set(key, { count: 1, firstRequestTime: now });
  }

  // Body hash implementation

  const bodyHash = hashBody(req.body);


  // Checking if request already completed in Redis

  const record = await store.get(key);

  if (record) {
    if (record.bodyHash !== bodyHash) {
      return res.status(409).json({
        error: "Idempotency key already used for a different request body.",
      });
    }

    res.set("X-Cache-Hit", "true");
    return res.status(record.status).json(record.response);
  }


  // Checking if request is currently processing = wait

  const pendingPromise = store.getPending(key);

  if (pendingPromise) {
    const result = await pendingPromise;

    res.set("X-Cache-Hit", "true");
    return res.status(result.status).json(result.response);
  }

  
  // First request = create pending promise
 
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  store.setPending(key, promise);

 
  // Overriding res.json to storing result in Redis

  const originalJson = res.json.bind(res);

  res.json = async function (body) {
    const result = {
      bodyHash,
      response: body,
      status: res.statusCode,
    };

    await store.set(key, result); 

    resolvePromise(result); 
    store.deletePending(key); 

    return originalJson(body);
  };

  next();
};