# Promply Contracts — Architecture

## System Blueprint

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (Promptly)                            │
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Web App   │    │  Mobile App │    │    SDK      │    │   Backend   │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
└─────────┼──────────────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │                  │
          └──────────────────┴────────┬─────────┴──────────────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │   Algorand Node       │
                         │  (LocalNet:4001)      │
                         └───────────┬────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Smart Contracts                                     │
│                                                                             │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────────┐ │
│  │  AgentRegistry   │   │  AgentExecutor   │   │   AgentReputation        │ │
│  │   (App ID: 2578) │   │   (App ID: 2579)  │   │   (App ID: 2580)         │ │
│  │                  │   │                  │   │                          │ │
│  │ - registerAgent  │   │ - invokeAgent    │   │ - stakeForAgent          │ │
│  │ - getAgent       │   │ - completeExec   │   │ - incrementReputation    │ │
│  │ - updateAgent    │   │ - failExecution  │   │ - decrementReputation    │ │
│  │ - deactivate     │   │ - getExecution   │   │ - getReputation          │ │
│  │ - transferOwner  │   │                  │   │                          │ │
│  │ - deleteAgent    │   │                  │   │                          │ │
│  │ - addCapability  │   │                  │   │                          │ │
│  └──────────────────┘   └──────────────────┘   └──────────────────────────┘ │
│                                                                             │
│  Storage: Boxes (key-value storage)                                         │
│  - Agent boxes: ag<agentId> -> Agent struct                                │
│  - Execution boxes: ex<executionId> -> Execution struct                    │
│  - Reputation boxes: re<agentId> -> Reputation struct                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
promptly-contracts/
├── projects/
│   └── promptly-contracts/          # AlgoKit project
│       ├── smart_contracts/
│       │   ├── agent_registry/       # Source contract files
│       │   │   └── contract.algo.ts  # All three contracts
│       │   ├── hello_world/          # Template contract
│       │   └── artifacts/            # Compiled TEAL + ABI JSON
│       │       ├── agent_registry/
│       │       │   ├── AgentRegistry.approval.teal
│       │       │   ├── AgentRegistry.arc56.json
│       │       │   ├── AgentRegistryClient.ts
│       │       │   ├── AgentExecutor.approval.teal
│       │       │   ├── AgentExecutor.arc56.json
│       │       │   ├── AgentExecutorClient.ts
│       │       │   ├── AgentReputation.approval.teal
│       │       │   ├── AgentReputation.arc56.json
│       │       │   └── AgentReputationClient.ts
│       │       └── hello_world/
│       ├── tests/
│       │   └── agent_registry.test.ts
│       ├── .algokit.toml
│       └── package.json
├── CONTRACTS.md                     # Deployed contract info
├── SPEC.md                          # Technical specification
├── ARCHITECTURE.md                  # This file
├── PLAN.md                          # Task plan
└── CONTEXT.md                       # Context checkpoint
```

## Contract Interaction Map

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   User/SDK   │────▶│  AgentRegistry  │◀────│   AgentReputation    │
└──────────────┘     └────────┬────────┘     └──────────────────────┘
                              │
                              │ (optional)
                              ▼
                    ┌─────────────────┐
                    │  AgentExecutor │
                    └─────────────────┘
```

- **AgentRegistry**: Entry point for all agent operations
- **AgentExecutor**: Optional execution tracking, called by users/integrations
- **AgentReputation**: Staking and reputation, can work alongside AgentRegistry

## State Layout

### Global State

| Contract | Key | Type | Purpose |
|---|---|---|---|
| AgentRegistry | nextAgentId | uint64 | Auto-incrementing agent ID counter |
| AgentRegistry | totalAgents | uint64 | Total count of registered agents |
| AgentRegistry | registryOwner | address | Owner address for admin operations |
| AgentExecutor | nextExecutionId | uint64 | Auto-incrementing execution ID counter |
| AgentExecutor | totalInvocations | uint64 | Total invocation count |
| AgentReputation | minStake | uint64 | Minimum stake amount (1M microALGO) |

### Local State

- **None** — All contracts use Box storage only (no local state)

### Boxes

| Contract | Box Name | Schema | Purpose |
|---|---|---|---|
| AgentRegistry | ag<agentId> | Agent struct | Individual agent data |
| AgentExecutor | ex<executionId> | Execution struct | Individual execution records |
| AgentReputation | re<agentId> | Reputation struct | Reputation data per agent |

## Deploy Flow

1. **Start LocalNet**: `python -m algokit localnet start`
2. **Compile contracts**: `python -m algokit compile ts smart_contracts`
3. **Generate clients**: `algokit generate client <arc56.json>`
4. **Deploy via AlgoKit**: `python -m algokit deploy localnet`
5. **Frontend/SDK** reads App IDs from `CONTRACTS.md` or environment
6. **Calls** made via ARC-56 TypeScript clients

## Testing

```bash
# Run all tests
cd promptly-contracts/projects/promptly-contracts
npx vitest run

# Output
# Test Files: 1 passed
# Tests: 20 passed (20)
```

## Environment Variables

```env
NEXT_PUBLIC_ALGOD_HOST=http://localhost:4001
NEXT_PUBLIC_ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
NEXT_PUBLIC_INDEXER_HOST=http://localhost:8980
NEXT_PUBLIC_AGENT_REGISTRY_APP_ID=2578
NEXT_PUBLIC_AGENT_EXECUTOR_APP_ID=2579
NEXT_PUBLIC_AGENT_REPUTATION_APP_ID=2580
```