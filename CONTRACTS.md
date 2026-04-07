# Promply Smart Contracts

## Overview

The Promply smart contracts implement ARC-8004 (ERC-8004 equivalent) — an AI Agent Registry system for the Promply prompt marketplace on Algorand. These contracts enable:
- Registration and management of AI agents
- Execution tracking for agent invocations
- Reputation and staking system for agent validation

## Deployed Contracts (LocalNet)

| Contract Name | App ID | App Address | Creator | Tx ID | Network |
|---|---|---|---|---|---|
| AgentRegistry | 2578 | E5P644K43UAX4IFO2HNOHD743XH7XLXG77YPF3PEQVY53BDE7N5EEJ6DGM | QZUNVQQ3T6TNOXUKZTEXZ4JJFFQ77AF5GKXUE2A43YC7FKXOLSBDI6O76Y | ER2UK7INDHF3TVPLXBEU6I7Q7UHCXEY6MM3Q6FPH7QTTVFZPZUJQ | LocalNet |
| AgentExecutor | 2579 | 6DU3WOTTCU63TGMDHWGGRKNYDFHZW7JEGOW24IUHGHJFLNOWR7RAI4UJBA | QZUNVQQ3T6TNOXUKZTEXZ4JJFFQ77AF5GKXUE2A43YC7FKXOLSBDI6O76Y | 6PL6IG6XOGB7VM4UQKPJJH7SLLPF5YSSODDIOO6UHYKIVWE5XFNA | LocalNet |
| AgentReputation | 2580 | M7OE4RTVC3GMK6GZX7MHVUIS6L5JRRWC3GBCRX4E3XCMDKPQMWOA6RRCA4 | QZUNVQQ3T6TNOXUKZTEXZ4JJFFQ77AF5GKXUE2A43YC7FKXOLSBDI6O76Y | 4ERQEMI6P4FXJVQQQ2PS672XBWVLIPYCYAGQVJA5TI4IA3GSQVGQ | LocalNet |
| HelloWorld | 2575 | — | QZUNVQQ3T6TNOXUKZTEXZ4JJFFQ77AF5GKXUE2A43YC7FKXOLSBDI6O76Y | S5A2ODPNJVRCXXAJXGKDQJIMHIAS5JRDZQ7Y2XUABLQCEW4KQEAA | LocalNet |

## Contract Details

### AgentRegistry

- **File**: `projects/promptly-contracts/smart_contracts/agent_registry/contract.algo.ts`
- **Language**: TypeScript (PuyaTs/AlgoKit)
- **ABI Methods**:
  - `registerAgent(string): uint64` — Register a new AI agent, returns agentId
  - `getAgent(uint64): (uint64,address,string,bool,uint64,uint64,uint64)` — Get agent details by ID
  - `updateAgent(uint64,string): void` — Update agent metadata (owner only)
  - `deactivateAgent(uint64): void` — Deactivate an agent
  - `reactivateAgent(uint64): void` — Reactivate a deactivated agent
  - `transferAgentOwnership(uint64,address): void` — Transfer ownership
  - `deleteAgent(uint64): void` — Delete an agent
  - `isAgentActive(uint64): bool` — Check if agent is active
  - `getAgentOwner(uint64): address` — Get agent owner address
  - `getTotalAgents(): uint64` — Get total registered agents
  - `addCapability(uint64,string): void` — Add capability to agent
  - `getCapabilityCount(uint64): uint64` — Get capability count
- **Global State**:
  - `nextAgentId` (uint64): Next available agent ID
  - `totalAgents` (uint64): Total number of registered agents
  - `registryOwner` (address): Owner of the registry
- **Local State**: None
- **Boxes**: Yes — Agent data stored in boxes with key prefix `ag`
- **Artifacts**:
  - Approval TEAL: `smart_contracts/artifacts/agent_registry/AgentRegistry.approval.teal`
  - Clear TEAL: `smart_contracts/artifacts/agent_registry/AgentRegistry.clear.teal`
  - ARC-56 JSON: `smart_contracts/artifacts/agent_registry/AgentRegistry.arc56.json`

### AgentExecutor

- **File**: `projects/promptly-contracts/smart_contracts/agent_registry/contract.algo.ts`
- **Language**: TypeScript (PuyaTs/AlgoKit)
- **ABI Methods**:
  - `invokeAgent(uint64,byte[],string): uint64` — Invoke an agent, returns executionId
  - `completeExecution(uint64): void` — Mark execution as completed
  - `failExecution(uint64): void` — Mark execution as failed
  - `getExecution(uint64): Execution` — Get execution details
  - `getInvocationCount(): uint64` — Get total invocation count
- **Global State**:
  - `nextExecutionId` (uint64): Next execution ID
  - `totalInvocations` (uint64): Total number of invocations
- **Local State**: None
- **Boxes**: Yes — Execution records stored with prefix `ex`
- **Artifacts**:
  - Approval TEAL: `smart_contracts/artifacts/agent_registry/AgentExecutor.approval.teal`
  - Clear TEAL: `smart_contracts/artifacts/agent_registry/AgentExecutor.clear.teal`
  - ARC-56 JSON: `smart_contracts/artifacts/agent_registry/AgentExecutor.arc56.json`

### AgentReputation

- **File**: `projects/promptly-contracts/smart_contracts/agent_registry/contract.algo.ts`
- **Language**: TypeScript (PuyaTs/AlgoKit)
- **ABI Methods**:
  - `stakeForAgent(uint64,uint64): void` — Stake ALGO for an agent
  - `unStakeForAgent(uint64): void` — Unstake ALGO
  - `incrementReputation(uint64): void` — Increment reputation score
  - `decrementReputation(uint64): void` — Decrement reputation score
  - `getReputation(uint64): Reputation` — Get full reputation struct
  - `getMinStake(): uint64` — Get minimum stake amount (1M microALGO)
- **Global State**:
  - `minStake` (uint64): Minimum stake amount (default 1,000,000)
- **Local State**: None
- **Boxes**: Yes — Reputation data stored with prefix `re`
- **Artifacts**:
  - Approval TEAL: `smart_contracts/artifacts/agent_registry/AgentReputation.approval.teal`
  - Clear TEAL: `smart_contracts/artifacts/agent_registry/AgentReputation.clear.teal`
  - ARC-56 JSON: `smart_contracts/artifacts/agent_registry/AgentReputation.arc56.json`

## LocalNet Connection Info

| Service | URL | Token |
|---|---|---|
| algod | http://localhost:4001 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
| indexer | http://localhost:8980 | — |
| kmd | http://localhost:4002 | — |

## Deployment Commands

```bash
# Start LocalNet
cd promptly-contracts/projects/promptly-contracts
python -m algokit localnet start

# Compile contracts
python -m algokit compile ts smart_contracts --output-source-map --out-dir artifacts

# Deploy to LocalNet
python -m algokit deploy localnet
```