# Promply Contracts — Context Checkpoint

## What Was Just Accomplished

- Ran `python -m algokit localnet start` — LocalNet is running ✅
- Inspected all contracts in `promptly-contracts/projects/promptly-contracts/`
- Compiled all contracts — TEAL artifacts confirmed present ✅
- Deployed all contracts to LocalNet ✅
- Captured App IDs, App Addresses, and Tx IDs ✅
- Generated CONTRACTS.md, SPEC.md, ARCHITECTURE.md, PLAN.md ✅

## Current State (actuals)

- **LocalNet**: Running ✅
  - algod: http://localhost:4001
  - indexer: http://localhost:8980
  - Token: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

- **Contracts deployed**: 4 total
  - AgentRegistry (App ID: 2578) — E5P644K43UAX4IFO2HNOHD743XH7XLXG77YPF3PEQVY53BDE7N5EEJ6DGM
  - AgentExecutor (App ID: 2579) — 6DU3WOTTCU63TGMDHWGGRKNYDFHZW7JEGOW24IUHGHJFLNOWR7RAI4UJBA
  - AgentReputation (App ID: 2580) — M7OE4RTVC3GMK6GZX7MHVUIS6L5JRRWC3GBCRX4E3XCMDKPQMWOA6RRCA4
  - HelloWorld (App ID: 2575) — template contract

- **Last deploy Tx IDs**:
  - AgentRegistry: ER2UK7INDHF3TVPLXBEU6I7Q7UHCXEY6MM3Q6FPH7QTTVFZPZUJQ
  - AgentExecutor: 6PL6IG6XOGB7VM4UQKPJJH7SLLPF5YSSODDIOO6UHYKIVWE5XFNA
  - AgentReputation: 4ERQEMI6P4FXJVQQQ2PS672XBWVLIPYCYAGQVJA5TI4IA3GSQVGQ

- **Tests**: 20/20 passing ✅

## What the Next Developer Needs to Know

### To continue development:

1. Run `python -m algokit localnet start` (if LocalNet is not running)
2. App IDs are in `CONTRACTS.md` — load them into env vars or SDK config
3. ABI JSON files are in `smart_contracts/artifacts/agent_registry/`
4. Use AlgoKit-generated typed clients from `smart_contracts/artifacts/agent_registry/*Client.ts`

### Known Issues / Gotchas

1. **GlobalState not auto-initialized**: In modern Puya, global state is NOT initialized automatically. The contract handles this by using `clone()` when reading and writing to state variables to ensure correct behavior.

2. **camelCase vs PascalCase**: Generated TypeScript clients use camelCase for struct fields. Always use `metadataUri` not `metadataURI` when calling methods.

3. **Box MBR**: Each box needs ~2,500 microALGO minimum balance. Deploy script funds contracts with 2 ALGO to cover this.

4. **No try-catch**: AVM doesn't support try-catch. Use `assert()` for error handling.

5. **No local state**: All contracts use Box storage exclusively for persistent data.

### Environment Variables to Export

```env
NEXT_PUBLIC_ALGOD_HOST=http://localhost:4001
NEXT_PUBLIC_ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
NEXT_PUBLIC_INDEXER_HOST=http://localhost:8980
NEXT_PUBLIC_AGENT_REGISTRY_APP_ID=2578
NEXT_PUBLIC_AGENT_EXECUTOR_APP_ID=2579
NEXT_PUBLIC_AGENT_REPUTATION_APP_ID=2580
```

### Next Steps (in priority order)

1. **Connect frontend SDK** — Use the App IDs and typed clients to integrate with Promply frontend
2. **Write E2E tests** — Test actual user flows on LocalNet
3. **Deploy to Testnet** — Update CONTRACTS.md with Testnet App IDs
4. **Add more contracts** — Prompt listing, purchase, royalty distribution (future phases)

### Project Files Reference

| Path | Purpose |
|---|---|
| `smart_contracts/agent_registry/contract.algo.ts` | Main contract source (AgentRegistry, AgentExecutor, AgentReputation) |
| `smart_contracts/artifacts/agent_registry/*.arc56.json` | ARC-56 app specs |
| `smart_contracts/artifacts/agent_registry/*Client.ts` | Generated TypeScript clients |
| `tests/agent_registry.test.ts` | Unit and integration tests |
| `smart_contracts/agent_registry/deploy-config.ts` | Deployment configuration |
| `CONTRACTS.md` | Deployed contract reference |
| `SPEC.md` | Technical specification |
| `ARCHITECTURE.md` | System design documentation |