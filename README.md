
## Idempotency-Gateway (The "Pay-Once" Protocol)
About

This project implements an Idempotency Layer for payment processing, ensuring that a payment request is processed exactly once even if clients retry due to network issues.

The system is designed for FinSafe Transactions Ltd., solving the problem of double-charging caused by network retries in e-commerce transactions.

## Architecture Overview

The system introduces an Idempotency Gateway between clients and the payment service.

It ensures that repeated requests with the same Idempotency-Key are processed only once.

## Key responsibilities of the gateway

Validate idempotency keys

Detect duplicate requests

Prevent conflicting payloads

Handle concurrent in-flight requests

Cache responses using Redis

Protect the system with rate limiting

## Architecture Diagram

```mermaid
flowchart TD

Client[Client Application] -->|Send Payment Request| API[API Server]

API -->|Check Rate Limit| Memory[In-Memory Rate Limit Store]

Memory -->|Limit Exceeded| Error429[Return 429 Too Many Requests]
Error429 --> Client

Memory -->|Allowed| Idempotency[(Redis Idempotency Store)]

Idempotency -->|Key Exists| Cached[Return Cached Response]
Cached --> Client

Idempotency -->|Request In Flight| Wait[Wait for First Request to Finish]
Wait --> Client

Idempotency -->|First Request| Payment[Process Payment]

Payment --> Service[Payment Service]

Service --> Save[Store Response in Redis with TTL]

Save --> Client
```