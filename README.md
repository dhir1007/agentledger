# AgentLedger

> AI Agent Memory that Pays for Itself.

AgentLedger is infrastructure for developers building AI agents that need **accountable, persistent memory**. Every memory write pays $0.001 USDC autonomously via [x402](https://x402.org) on Base, embeds via Amazon Titan on AWS Bedrock, and posts a cryptographic Merkle proof to Solana — so you can prove exactly what your agent knew at any point in time.

Built at **EasyA × Consensus Miami Hackathon 2026**.

---

## The Problem

AI agents are making real decisions — financial recommendations, customer commitments, autonomous transactions. Their memory lives in plain databases with no audit trail. When something goes wrong, nobody can prove what the agent knew.

Air Canada lost a lawsuit because their AI agent made a decision they couldn't audit. That's every AI deployment today.

---

## The Solution

Three layers, working together:

```
Agent sends text
      ↓
Amazon Titan (AWS Bedrock) → 1024-dim embedding
      ↓
Recall HNSW → encrypted vector stored (4.7ms P99)
      ↓
x402 payment → $0.001 USDC on Base Sepolia (autonomous)
      ↓
SHA-256 Merkle root → posted to Solana Anchor program
      ↓
Proof: permanent, public, tamper-evident
```

---

## How It Works

### x402 Payment Flow

Every memory write triggers a real x402 payment:

1. App calls the memory API endpoint
2. API responds with `HTTP 402 Payment Required`
3. CDP wallet signs an EIP-3009 `TransferWithAuthorization` for $0.001 USDC
4. Request retried with `X-PAYMENT` header
5. CDP facilitator verifies and settles on Base Sepolia
6. Memory is stored, Merkle root is computed and posted to Solana

This is machine-to-machine micropayment with no human intervention — the exact use case x402 was designed for.

### AWS Bedrock

Two models used:

- **Amazon Titan Embed Text V2** — generates 1024-dimensional vector embeddings for every memory stored
- **Amazon Nova Lite** — LLM inference, generates responses using retrieved memory context

Both accessed via AWS Bedrock in `us-east-1`. No separate model hosting needed.

### Recall + Solana

[Recall](https://veclabs.xyz) is an open-source Rust HNSW vector engine with:
- AES-256-GCM client-side encryption
- 4.7ms P99 at 100K vectors (no garbage collector)
- SHA-256 Merkle tree computed after every write
- Merkle root posted to Solana Anchor program: [`8xjQ2XrdhR4JkGAdTEB7i34DBkbrLRkcgchKjN1Vn5nP`](https://explorer.solana.com/address/8xjQ2XrdhR4JkGAdTEB7i34DBkbrLRkcgchKjN1Vn5nP?cluster=devnet)

---

## Repo Structure

```
agentledger/
├── app/
│   ├── api/
│   │   └── memory/
│   │       └── route.ts       # Core API: store, query, verify + x402 + Bedrock
│   ├── page.tsx               # Main UI: Store / Query / Verify tabs
│   ├── layout.tsx
│   └── globals.css
├── screenshots/               # Demo screenshots for README
├── .env.local.example         # Environment variables template
├── next.config.ts
└── package.json
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Embeddings | Amazon Titan Embed Text V2 (AWS Bedrock) |
| LLM Inference | Amazon Nova Lite (AWS Bedrock) |
| Payments | x402 + Coinbase CDP on Base Sepolia |
| Vector DB | Recall (Rust HNSW, open source) |
| On-chain proof | Solana Anchor program |
| Deployment | AWS Amplify |
| Framework | Next.js 15 (TypeScript) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- AWS account with Bedrock access
- Coinbase CDP account
- Recall API key (free at [app.veclabs.xyz](https://app.veclabs.xyz))

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/agentledger
cd agentledger
npm install --legacy-peer-deps
```

### Environment Variables

Create `.env.local`:

```env
# Recall
RECALL_API_KEY=vl_live_...

# AWS Bedrock
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# CDP / x402
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
AGENT_PRIVATE_KEY=0x...
AGENT_ADDRESS=0x...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How Blockchain Is Used

**x402 on Base:**
Every memory write triggers an autonomous USDC payment. The agent signs an EIP-3009 authorization using a CDP wallet and submits it to the Coinbase facilitator. No human approval. No subscription. Pay only for what you use.

**Solana:**
After every write, AgentLedger computes a SHA-256 Merkle root of all stored vector IDs and posts it to our Anchor program on Solana devnet. This root is a cryptographic fingerprint of the agent's memory at that moment. If anyone modifies even one memory — the root changes. Anyone can verify the proof forever at:

[`8xjQ2XrdhR4JkGAdTEB7i34DBkbrLRkcgchKjN1Vn5nP`](https://explorer.solana.com/address/8xjQ2XrdhR4JkGAdTEB7i34DBkbrLRkcgchKjN1Vn5nP?cluster=devnet)

---

## Economic Reasoning

AgentLedger demonstrates x402's core value proposition for AI agents:

- **Why pay per use?** Agents spin up and down dynamically. Subscriptions charge for idle time. x402 charges only for actual memory writes.
- **Why autonomous payment?** The agent acquires its own cognitive infrastructure without human billing intervention. This is the foundation of autonomous agent economies.
- **Why $0.001 USDC?** Microtransactions this small are impossible with traditional payment rails. x402 on Base makes them economically viable.

---

## Pre-existing Code Disclosure

This project builds on [Recall](https://github.com/veclabs/recall) — an open-source Rust vector database built by the same developer before this hackathon. Per EasyA rules, this has been disclosed to organizers. The hackathon-specific work includes:

- x402 payment integration in `app/api/memory/route.ts`
- AWS Bedrock (Titan + Nova) integration
- AgentLedger UI (`app/page.tsx`)
- The combination of x402 + Recall + Solana as an autonomous agent memory layer

---

## License

MIT
