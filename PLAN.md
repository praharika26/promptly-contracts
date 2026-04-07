# Promply Contracts — Task Plan

## Phase 0 — Environment

- [x] AlgoKit installed and confirmed (v2.10.2 via `python -m algokit`)
- [x] Docker running
- [x] LocalNet started successfully (algod:4001, indexer:8980)
- [x] Project structure verified

## Phase 1 — Contract Design

- [x] Define all ABI methods for each contract
- [x] Define global/local state schema
- [x] Define box storage schema (Agent, Execution, Reputation)
- [x] Write ARC-56 compliant contracts (TypeScript/PuyaTs)

## Phase 2 — Compile & Build

- [x] All contracts compile without errors
- [x] All TEAL artifacts generated
- [x] All ARC-56 JSON generated
- [x] TypeScript clients generated

## Phase 3 — Deploy

- [x] All contracts deployed to LocalNet
- [x] App IDs captured and recorded in CONTRACTS.md
  - AgentRegistry: 2578
  - AgentExecutor: 2579
  - AgentReputation: 2580
- [x] Deployment via `algokit deploy localnet`
- [x] HelloWorld also deployed (App ID: 2575)

## Phase 4 — Testing

- [x] Unit tests written for each ABI method
- [x] Happy path tests passing (20/20)
- [x] Edge case and error condition tests passing

## Phase 5 — Documentation

- [x] CONTRACTS.md generated with deployed contract info
- [x] SPEC.md generated with technical specification
- [x] ARCHITECTURE.md generated with system design
- [x] PLAN.md (this file) generated
- [x] CONTEXT.md (next file) to be generated

## Phase 6 — Integration (Next Steps)

- [ ] Connect frontend SDK to deployed contracts
- [ ] Wire the frontend to call contracts via SDK
- [ ] Deploy to Algorand Testnet

## Known Issues / Gotchas

1. **GlobalState initialization**: Modern Puya doesn't auto-initialize global state. First method call that writes to a state variable initializes it. This is why `totalAgents` starts at 0 and increments correctly.

2. **TypeScript client camelCase**: Generated clients use camelCase for struct fields (e.g., `metadataUri` not `metadataURI`). Tests must use camelCase.

3. **Box storage MBR**: Each box requires ~2,500 microALGO minimum balance. The deploy script funds each contract with 2 ALGO to cover MBR.

4. **No try-catch in AVM**: Puya doesn't support try-catch statements. Error handling uses assert-based validation.

## Completed Tasks

1. Created agent_registry contract with AgentRegistry, AgentExecutor, AgentReputation classes
2. Implemented all ABI methods with proper validation
3. Used Box storage for all persistent data (no local state)
4. Generated ARC-56 compliant clients
5. Deployed all contracts to LocalNet
6. All 20 tests passing
7. Generated comprehensive documentation