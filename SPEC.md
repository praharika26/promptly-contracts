# Promply Contracts — Specification

## Project Goals

- Build a decentralized AI prompt marketplace on Algorand
- Allow creators to publish, price, and sell prompts as on-chain assets
- Allow buyers to purchase access to prompts using ALGO or ASAs
- Enforce royalties and revenue splits on-chain via agent registry system

## Technical Constraints

- **Chain**: Algorand MainNet (deploy target), LocalNet (development)
- **Language**: TypeScript (PuyaTs/AlgoKit)
- **ABI Standard**: ARC-32 / ARC-56
- **AlgoKit Version**: 2.10.2 (via `python -m algokit --version`)
- **Box storage**: Yes — Agent, Execution, and Reputation data stored in boxes
- **Minimum balance requirements**: 
  - Each contract requires ~2 ALGO for MBR (minimum balance requirement)
  - Agent boxes require additional MBR based on box size

## Contract Responsibilities

### AgentRegistry
- **Single-sentence responsibility**: Core registry for registering and managing AI agents on-chain
- **Who calls it**: Frontend SDK, other contracts, direct user calls
- **Key features**:
  - Register new AI agents with metadata URI
  - Update agent metadata (owner-only)
  - Activate/deactivate agents
  - Transfer agent ownership
  - Add capabilities to agents
  - Query agent details and ownership

### AgentExecutor
- **Single-sentence responsibility**: Execution hook for tracking AI agent invocations
- **Who calls it**: Frontend SDK when invoking agents
- **Key features**:
  - Record agent invocations with input hash
  - Track execution status (pending, completed, failed)
  - Query execution records

### AgentReputation
- **Single-sentence responsibility**: Reputation and staking system for AI agents
- **Who calls it**: Frontend SDK, stake/unstake operations
- **Key features**:
  - Stake ALGO for agents (minimum 1M microALGO)
  - Increment/decrement reputation scores
  - Track total staked, invocations, successful invocations

## Out of Scope (v1)

- **Prompt purchase/listing**: Not implemented — will be in future contract
- **Royalty distribution**: Not implemented — will be in future contract
- **ASA-based payments**: Not implemented — ALGO-only for v1
- **Multi-sig ownership**: Not implemented — single owner per agent for v1
- **Agent delegation**: Not implemented — only owner can invoke

## Contract State Schema

### AgentRegistry Global State
| Key | Type | Purpose |
|---|---|---|
| nextAgentId | uint64 | Auto-incrementing agent ID |
| totalAgents | uint64 | Total registered agents |
| registryOwner | address | Owner of the registry |

### AgentExecutor Global State
| Key | Type | Purpose |
|---|---|---|
| nextExecutionId | uint64 | Auto-incrementing execution ID |
| totalInvocations | uint64 | Total number of invocations |

### AgentReputation Global State
| Key | Type | Purpose |
|---|---|---|
| minStake | uint64 | Minimum stake amount (default 1M microALGO) |

### Box Storage
- AgentRegistry: BoxMap with prefix `ag` (agentId -> Agent struct)
- AgentExecutor: BoxMap with prefix `ex` (executionId -> Execution struct)
- AgentReputation: BoxMap with prefix `re` (agentId -> Reputation struct)

## Error Codes

All contracts use assert-based error handling with descriptive strings:
- "Metadata URI cannot be empty"
- "Agent not found"
- "Only owner can update"
- "Insufficient stake amount"
- etc.