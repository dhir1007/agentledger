"use client";

import { useState } from "react";

interface Memory {
  id: string;
  text: string;
  merkleRoot: string;
  payment: {
    amount: string;
    currency: string;
    network: string;
    txHash: string;
    timestamp: string;
  };
  timestamp: string;
}

interface QueryResult {
  answer: string;
  memoryCount: number;
  memories: Array<{ id: string; score: number; metadata: { text: string } }>;
}

interface VerifyResult {
  verified: boolean;
  localRoot: string;
  onChainRoot?: string;
  match: boolean | null;
  vectorCount: number;
  message: string;
  solanaExplorerUrl?: string;
}

export default function Home() {
  const [tab, setTab] = useState<"store" | "query" | "verify">("store");
  const [storeText, setStoreText] = useState("");
  const [queryText, setQueryText] = useState("");
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");

  async function handleStore() {
    if (!storeText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "store", text: storeText }),
      });
      const data = await res.json();
      if (data.success) {
        setMemories((prev) => [
          {
            id: data.id,
            text: storeText,
            merkleRoot: data.merkleRoot,
            payment: data.payment,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
        setStoreText("");
      } else {
        setError(data.error || "Failed to store memory");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleQuery() {
    if (!queryText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "query", query: queryText }),
      });
      const data = await res.json();
      if (data.success) {
        setQueryResult(data);
      } else {
        setError(data.error || "Failed to query");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleVerify() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyResult({
          verified: data.verified,
          localRoot: data.localRoot,
          onChainRoot: data.onChainRoot,
          match: data.match,
          vectorCount: data.vectorCount,
          message: data.match
            ? `Local root matches on-chain root. ${data.vectorCount} vectors verified on Solana.`
            : 'Root mismatch — memory may have been tampered with.',
          solanaExplorerUrl: data.solanaExplorerUrl,
        });
      } else {
        setError(data.error || "Failed to verify");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080604",
        fontFamily: "ui-monospace, monospace",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #1a0e08",
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "#c2692a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              borderRadius: 6,
            }}
          >
            A
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#fdf6ee",
                letterSpacing: "0.02em",
              }}
            >
              AgentLedger
            </div>
            <div
              style={{ fontSize: 10, color: "#7a5a3e", letterSpacing: "0.1em" }}
            >
              PAY-PER-MEMORY · CRYPTOGRAPHIC PROOF
            </div>
          </div>
        </div>
        <div
          style={{ display: "flex", gap: 16, fontSize: 11, color: "#5a3a20" }}
        >
          <span>
            Powered by <span style={{ color: "#c2692a" }}>Recall</span>
          </span>
          <span>·</span>
          <span>
            x402 on <span style={{ color: "#c2692a" }}>Base</span>
          </span>
          <span>·</span>
          <span>
            AWS <span style={{ color: "#c2692a" }}>Bedrock</span>
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#fdf6ee",
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
            }}
          >
            AI Agent Memory that
            <br />
            <span style={{ color: "#c2692a" }}>Pays for Itself.</span>
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#7a5a3e",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Every memory write pays $0.001 USDC via x402 on Base. Every write is
            encrypted, stored permanently on Arweave, and cryptographically
            provable on Solana.
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 24,
            border: "1px solid #1a0e08",
            width: "fit-content",
            margin: "0 auto 32px",
          }}
        >
          {(["store", "query", "verify"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 28px",
                fontSize: 11,
                fontFamily: "inherit",
                background: tab === t ? "#c2692a" : "transparent",
                color: tab === t ? "#fff" : "#7a5a3e",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {t === "store"
                ? "+ Store Memory"
                : t === "query"
                  ? "⟳ Query Agent"
                  : "✓ Verify Proof"}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              background: "#1a0404",
              border: "1px solid #3a0808",
              padding: "12px 16px",
              marginBottom: 20,
              color: "#f87171",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* Store Tab */}
        {tab === "store" && (
          <div>
            <div
              style={{
                background: "#0f0804",
                border: "1px solid #1a0e08",
                borderRadius: 8,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#7a5a3e",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                What should the agent remember?
              </div>
              <textarea
                value={storeText}
                onChange={(e) => setStoreText(e.target.value)}
                placeholder="e.g. User's risk tolerance is low. Prefers blue-chip tokens only. Never invests more than 10% in a single asset."
                style={{
                  width: "100%",
                  height: 100,
                  background: "#080604",
                  border: "1px solid #2e1a10",
                  borderRadius: 6,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: "#fdf6ee",
                  fontFamily: "inherit",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 12,
                }}
              >
                <div style={{ fontSize: 10, color: "#5a3a20" }}>
                  Cost: <span style={{ color: "#c2692a" }}>$0.001 USDC</span>{" "}
                  via x402 on Base · Embedded via{" "}
                  <span style={{ color: "#c2692a" }}>Amazon Titan</span>
                </div>
                <button
                  onClick={handleStore}
                  disabled={loading || !storeText.trim()}
                  style={{
                    background: loading ? "#2e1a10" : "#c2692a",
                    color: "#fff",
                    border: "none",
                    padding: "10px 24px",
                    fontSize: 12,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Processing..." : "Store & Pay →"}
                </button>
              </div>
            </div>

            {/* Memory feed */}
            {memories.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#7a5a3e",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Memory ledger ({memories.length} writes)
                </div>
                {memories.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "#0f0804",
                      border: "1px solid #1a0e08",
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 10, color: "#c2692a" }}>
                        {m.id}
                      </span>
                      <span style={{ fontSize: 10, color: "#5a3a20" }}>
                        {new Date(m.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#fdf6ee",
                        marginBottom: 10,
                      }}
                    >
                      {m.text}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          background: "#080604",
                          border: "1px solid #1a0e08",
                          borderRadius: 4,
                          padding: "8px 10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: "#5a3a20",
                            marginBottom: 4,
                          }}
                        >
                          MERKLE ROOT
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#4ade80",
                            wordBreak: "break-all",
                          }}
                        >
                          {m.merkleRoot?.slice(0, 32)}...
                        </div>
                      </div>
                      <div
                        style={{
                          background: "#080604",
                          border: "1px solid #1a0e08",
                          borderRadius: 4,
                          padding: "8px 10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: "#5a3a20",
                            marginBottom: 4,
                          }}
                        >
                          x402 PAYMENT
                        </div>
                        <div style={{ fontSize: 10, color: "#60a5fa" }}>
                          {m.payment.amount} {m.payment.currency} on{" "}
                          {m.payment.network}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: "#5a3a20",
                            marginTop: 2,
                            wordBreak: "break-all",
                          }}
                        >
                          {m.payment.txHash.slice(0, 20)}...
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Query Tab */}
        {tab === "query" && (
          <div>
            <div
              style={{
                background: "#0f0804",
                border: "1px solid #1a0e08",
                borderRadius: 8,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#7a5a3e",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Ask the agent — it will use its memory
              </div>
              <input
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                placeholder="e.g. Should I invest in this new DeFi token?"
                style={{
                  width: "100%",
                  background: "#080604",
                  border: "1px solid #2e1a10",
                  borderRadius: 6,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: "#fdf6ee",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 10, color: "#5a3a20" }}>
                  Powered by <span style={{ color: "#c2692a" }}>Nova</span> on
                  Amazon Bedrock
                </div>
                <button
                  onClick={handleQuery}
                  disabled={loading || !queryText.trim()}
                  style={{
                    background: loading ? "#2e1a10" : "#c2692a",
                    color: "#fff",
                    border: "none",
                    padding: "10px 24px",
                    fontSize: 12,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Thinking..." : "Ask Agent →"}
                </button>
              </div>
            </div>

            {queryResult && (
              <div>
                <div
                  style={{
                    background: "#0a1a08",
                    border: "1px solid #1a3a10",
                    borderRadius: 8,
                    padding: 20,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#4ade80",
                      letterSpacing: "0.1em",
                      marginBottom: 10,
                    }}
                  >
                    AGENT RESPONSE · Using {queryResult.memoryCount} memories
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#fdf6ee", lineHeight: 1.65 }}
                  >
                    {queryResult.answer}
                  </div>
                </div>
                {queryResult.memories.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#7a5a3e",
                        letterSpacing: "0.1em",
                        marginBottom: 10,
                      }}
                    >
                      MEMORIES USED
                    </div>
                    {queryResult.memories.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#0f0804",
                          border: "1px solid #1a0e08",
                          borderRadius: 6,
                          padding: "10px 14px",
                          marginBottom: 8,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 12, color: "#c4a882" }}>
                          {m.metadata?.text}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: "#c2692a",
                            marginLeft: 12,
                            flexShrink: 0,
                          }}
                        >
                          score: {m.score?.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Verify Tab */}
        {tab === "verify" && (
          <div>
            <div
              style={{
                background: "#0f0804",
                border: "1px solid #1a0e08",
                borderRadius: 8,
                padding: 24,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
              <div style={{ fontSize: 14, color: "#fdf6ee", marginBottom: 8 }}>
                Verify Memory Integrity
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#7a5a3e",
                  marginBottom: 20,
                  maxWidth: 400,
                  margin: "0 auto 20px",
                }}
              >
                Recomputes the SHA-256 Merkle root from all stored vectors and
                compares against the proof. Tamper-evident — any modification
                breaks the proof.
              </div>
              <button
                onClick={handleVerify}
                disabled={loading}
                style={{
                  background: loading ? "#2e1a10" : "#c2692a",
                  color: "#fff",
                  border: "none",
                  padding: "12px 32px",
                  fontSize: 12,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                {loading ? "Verifying..." : "Verify Proof →"}
              </button>
            </div>

            {verifyResult && (
              <div
                style={{
                  background: verifyResult.verified ? "#0a1a08" : "#1a0808",
                  border: `1px solid ${verifyResult.verified ? "#1a3a10" : "#3a1010"}`,
                  borderRadius: 8,
                  padding: 24,
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 12 }}>
                  {verifyResult.verified ? "✅" : "❌"}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: verifyResult.verified ? "#4ade80" : "#f87171",
                    marginBottom: 16,
                  }}
                >
                  {verifyResult.verified
                    ? "Memory Verified — Tamper-Free"
                    : "Verification Failed"}
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      background: "#080604",
                      border: "1px solid #1a0e08",
                      borderRadius: 6,
                      padding: "10px 14px",
                    }}
                  >
                    <div
                      style={{ fontSize: 9, color: "#5a3a20", marginBottom: 4 }}
                    >
                      LOCAL MERKLE ROOT
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#4ade80",
                        wordBreak: "break-all",
                      }}
                    >
                      {verifyResult.localRoot}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#080604",
                      border: "1px solid #1a0e08",
                      borderRadius: 6,
                      padding: "10px 14px",
                    }}
                  >
                    <div
                      style={{ fontSize: 9, color: "#5a3a20", marginBottom: 4 }}
                    >
                      VECTORS VERIFIED
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#fdf6ee",
                      }}
                    >
                      {verifyResult.vectorCount}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#080604",
                      border: "1px solid #1a0e08",
                      borderRadius: 6,
                      padding: "10px 14px",
                    }}
                  >
                    <div
                      style={{ fontSize: 9, color: "#5a3a20", marginBottom: 4 }}
                    >
                      STATUS
                    </div>
                    <div style={{ fontSize: 12, color: "#c4a882" }}>
                      {verifyResult.message}
                    </div>
                    
                  </div>
                  {verifyResult.solanaExplorerUrl && (
                    
                    <a
                    href={verifyResult.solanaExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      background: "#080604",
                      border: "1px solid #1a0e08",
                      borderRadius: 6,
                      padding: "10px 14px",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ fontSize: 9, color: "#5a3a20", marginBottom: 4 }}>
                      SOLANA EXPLORER
                    </div>
                    <div style={{ fontSize: 11, color: "#c2692a" }}>
                      View on-chain proof ↗
                    </div>
                  </a>
                )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid #1a0e08",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: "#3a2010",
          }}
        >
          <span>AgentLedger · Built at Consensus Miami 2026</span>
          <span>Recall + x402 + AWS Bedrock + Solana</span>
        </div>
      </div>
    </div>
  );
}
