require('dotenv').config();
const { createClient } = require('redis');

// Connection to Redis Cloud
const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT)
  }
});

client.on('error', err => console.log('Redis Client Error', err));

// Initializing Redis connection
async function initRedis() {
  await client.connect();
  console.log('Redis connected');
}
initRedis();

// Pending requests map stays in-memory
const pending = new Map();



async function get(key) {
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

async function set(key, value, ttl = 86400) {
  await client.set(key, JSON.stringify(value), { EX: ttl });
}


// Pending in-flight requests


function getPending(key) {
  return pending.get(key);
}

function setPending(key, value) {
  pending.set(key, value);
}

function deletePending(key) {
  pending.delete(key);
}

module.exports = {
  get,
  set,
  getPending,
  setPending,
  deletePending,
};