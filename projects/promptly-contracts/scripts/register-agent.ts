import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AgentRegistryClient } from '../smart_contracts/artifacts/agent_registry/AgentRegistryClient'
import algosdk from 'algosdk'

async function run() {
  console.log("=== Registration Script (AgentRegistryClient) ===");
  const algorand = AlgorandClient.defaultLocalNet()
  const deployer = await algorand.account.localNetDispenser()
  console.log(`Using deployer: ${deployer.addr}`)

  const registryId = 2584 
  const registryClient = new AgentRegistryClient({
    appId: registryId,
    defaultSender: deployer.addr,
    algorand,
  })

  // Fund app account for Box MBR
  console.log(`Funding app account ${registryClient.appAddress} for Box MBR...`)
  await algorand.send.payment({
    sender: deployer.addr,
    receiver: registryClient.appAddress,
    amount: (2).algos(), // This helper should be available in v9 via Number prototype or similar extensions if imported
  })

  const metadata = {
    name: "Promptly Sentinel",
    description: "Security focused agent for Algorand smart contracts.",
    category: "Security",
    priceAlgo: 50000000 
  }

  const note = new Uint8Array(Buffer.from(JSON.stringify(metadata)))

  console.log(`Registering agent: ${metadata.name}...`)

  // Box name for agent ID 1: "ag" + uint64(1)
  const agentId = 1n
  const boxName = new Uint8Array([...Buffer.from("ag"), ...algosdk.encodeUint64(agentId)])

  try {
    const result = await registryClient.send.registerAgent({
      args: {
        metadataUri: "ipfs://QmSentinel"
      },
      note: note,
      boxReferences: [boxName],
    })

    console.log(`\n=== Registration Successful ===`)
    console.log(`Transaction ID: ${result.transaction.txID()}`)
    console.log(`Agent ID: ${result.return}\n`)
  } catch (err: any) {
    console.error('Registration failed:', err.message || err)
    if (err.stack) console.error(err.stack)
  }
}

run().catch(console.error)
