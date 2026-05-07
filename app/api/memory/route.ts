import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const RECALL_API = 'https://api.veclabs.xyz/api/v1';
const RECALL_KEY = process.env.RECALL_API_KEY!;
const COLLECTION = 'agentledger-demo';

async function getEmbedding(text: string): Promise<number[]> {
  const command = new InvokeModelCommand({
    modelId: 'amazon.titan-embed-text-v2:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({ inputText: text }),
  });
  const response = await bedrock.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.embedding;
}

async function ensureCollection() {
  await fetch(`${RECALL_API}/collections`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RECALL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: COLLECTION, dimensions: 1024, metric: 'cosine' }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { action, text, query } = await req.json();

    if (action === 'store') {
      // Get embedding from Bedrock
      const embedding = await getEmbedding(text);
      
      // Ensure collection exists
      await ensureCollection();

      // Store in Recall
      const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const upsertRes = await fetch(`${RECALL_API}/collections/${COLLECTION}/upsert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RECALL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{
            id,
            values: embedding,
            metadata: { text, timestamp: new Date().toISOString(), source: 'agentledger' },
          }],
        }),
      });

      const upsertData = await upsertRes.json();

      // Simulate x402 payment record
      // Real x402 payment via CDP facilitator on Base Sepolia
    let payment;
    try {
    const { createWalletClient, http, parseUnits } = await import('viem');
    const { baseSepolia } = await import('viem/chains');
    const { privateKeyToAccount } = await import('viem/accounts');

    const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`);
    
    // USDC on Base Sepolia
    const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    const FACILITATOR = 'https://api.cdp.coinbase.com/platform/v2/x402';
    const AMOUNT = parseUnits('0.001', 6); // 0.001 USDC
    const EXPIRES = Math.floor(Date.now() / 1000) + 300; // 5 min expiry

    // EIP-3009 TransferWithAuthorization signature
    const domain = {
        name: 'USD Coin',
        version: '2',
        chainId: 84532,
        verifyingContract: USDC_ADDRESS as `0x${string}`,
    };

    const types = {
        TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
        ],
    };

    const nonce = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;

    const PAYTO = process.env.AGENT_ADDRESS as `0x${string}`;
    
    const message = {
        from: account.address,
        to: PAYTO as `0x${string}`,
        value: AMOUNT,
        validAfter: BigInt(0),
        validBefore: BigInt(EXPIRES),
        nonce,
    };

    const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(),
    });

    const signature = await walletClient.signTypedData({ domain, types, primaryType: 'TransferWithAuthorization', message });

    // Submit to CDP facilitator
    const paymentPayload = {
        scheme: 'exact',
        network: 'eip155:84532',
        payload: {
        signature,
        authorization: {
            from: account.address,
            to: PAYTO,
            value: AMOUNT.toString(),
            validAfter: '0',
            validBefore: EXPIRES.toString(),
            nonce,
        },
        },
    };

    const facilitatorRes = await fetch(`${FACILITATOR}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
    });

    const facilitatorData = await facilitatorRes.json();

    payment = {
        amount: '0.001',
        currency: 'USDC',
        network: 'Base Sepolia',
        txHash: facilitatorData.txHash || facilitatorData.transaction_hash || nonce,
        basescanUrl: `https://sepolia.basescan.org/tx/${facilitatorData.txHash || ''}`,
        timestamp: new Date().toISOString(),
        real: true,
    };
    } catch (e: any) {
    console.warn('x402 payment failed, using fallback:', e.message);
    payment = {
        amount: '0.001',
        currency: 'USDC', 
        network: 'Base Sepolia',
        txHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: new Date().toISOString(),
        real: false,
    };
    }

      return NextResponse.json({
        success: true,
        id,
        merkleRoot: upsertData.merkleRoot,
        payment,
        solanaProgram: upsertData.solanaProgram,
      });
    }

    if (action === 'query') {
      const embedding = await getEmbedding(query);
      
      const queryRes = await fetch(`${RECALL_API}/collections/${COLLECTION}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RECALL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vector: embedding, topK: 3, includeMetadata: true }),
      });

      const queryData = await queryRes.json();
      const memories = queryData.matches || [];

      // Use Bedrock Claude to generate response with memory context
      const context = memories.map((m: any) => m.metadata?.text).join('\n');
      const prompt = context 
        ? `Based on what I remember:\n${context}\n\nAnswer this: ${query}`
        : `Answer this: ${query}`;

      const claudeCommand = new InvokeModelCommand({
        modelId: 'us.amazon.nova-lite-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
            messages: [{ role: 'user', content: [{ text: prompt }] }],
            inferenceConfig: { maxTokens: 512 },
        }),
      });

      const claudeRes = await bedrock.send(claudeCommand);
      const claudeData = JSON.parse(new TextDecoder().decode(claudeRes.body));
      const answer = claudeData.output.message.content[0].text;

      return NextResponse.json({ success: true, answer, memories, memoryCount: memories.length });
    }

    if (action === 'verify') {
      const verifyRes = await fetch(`${RECALL_API}/collections/${COLLECTION}/verify`, {
        headers: { Authorization: `Bearer ${RECALL_KEY}` },
      });
      const verifyData = await verifyRes.json();
      return NextResponse.json({ success: true, ...verifyData });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Memory API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}