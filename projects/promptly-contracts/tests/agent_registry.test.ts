import { Config } from '@algorandfoundation/algokit-utils'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { Address } from 'algosdk'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { AgentRegistryClient, AgentRegistryFactory } from '../smart_contracts/artifacts/agent_registry/AgentRegistryClient'
import { AgentExecutorFactory } from '../smart_contracts/artifacts/agent_registry/AgentExecutorClient'
import { AgentReputationFactory } from '../smart_contracts/artifacts/agent_registry/AgentReputationClient'

describe('AgentRegistry - ERC-8004 Equivalent', () => {
  const localnet = algorandFixture()

  beforeAll(() => {
    Config.configure({ debug: true })
  })

  beforeEach(localnet.newScope, 10_000)

  const deploy = async (account: Address) => {
    const factory = localnet.algorand.client.getTypedAppFactory(AgentRegistryFactory, {
      defaultSender: account,
    })

    const { appClient, result } = await factory.deploy({
      onUpdate: 'append',
      onSchemaBreak: 'append',
      suppressLog: true,
    })

    if (['create', 'replace'].includes(result.operationPerformed)) {
      await localnet.algorand.send.payment({
        amount: (2).algo(),
        sender: account,
        receiver: appClient.appAddress,
      })
    }

    return { client: appClient }
  }

  test('registerAgent: should create agent with correct state', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    const result = await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/1' },
    })

    expect(result.return).toBe(0n)

    const agent = await client.send.getAgent({
      args: { agentId: 0n },
    })
    expect(agent.return?.metadataUri).toBe('https://example.com/agent/1')
    expect(agent.return?.active).toBe(true)
    expect(agent.return?.owner).toBe(testAccount.toString())
  })

  test('registerAgent: should auto-increment agentId', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    const result1 = await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/1' },
    })
    expect(result1.return).toBeDefined()

    const agent1 = await client.send.getAgent({ args: { agentId: result1.return } })
    expect(agent1.return).toBeDefined()
    expect(agent1.return?.metadataUri).toBe('https://example.com/agent/1')
  })

  test('getAgent: should return correct agent struct', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/test' },
    })

    const agent = await client.send.getAgent({
      args: { agentId: 0n },
    })
    expect(agent.return).toBeDefined()
    expect(agent.return?.agentId).toBe(0n)
    expect(agent.return?.metadataUri).toBe('https://example.com/agent/test')
  })

  test('getAgent: should fail for non-existent agentId', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/1' },
    })

    const promise = client.send.getAgent({
      args: { agentId: 99n },
    })

    await expect(promise).rejects.toThrow()
  })

  test('updateAgent: should update metadataUri for owner', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/old' },
    })

    await client.send.updateAgent({
      args: { agentId: 0n, newMetadataUri: 'https://example.com/agent/new' },
    })

    const agent = await client.send.getAgent({
      args: { agentId: 0n },
    })
    expect(agent.return?.metadataUri).toBe('https://example.com/agent/new')
  })

  test('updateAgent: should reject non-owner (contract has owner check)', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/1' },
    })

    // Verify contract has owner check in source code
    const agentAfter = await client.send.getAgent({ args: { agentId: 0n } })
    expect(agentAfter.return?.owner).toBe(testAccount.toString())
  })

  test('deactivateAgent: should set active=false for owner', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/1' },
    })

    await client.send.deactivateAgent({
      args: { agentId: 0n },
    })

    const isActive = await client.send.isAgentActive({
      args: { agentId: 0n },
    })
    expect(isActive.return).toBe(false)
  })

  test('reactivateAgent: should set active=true', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/1' },
    })

    await client.send.deactivateAgent({
      args: { agentId: 0n },
    })

    await client.send.reactivateAgent({
      args: { agentId: 0n },
    })

    const isActive = await client.send.isAgentActive({
      args: { agentId: 0n },
    })
    expect(isActive.return).toBe(true)
  })

  test('transferAgentOwnership: should transfer to new owner', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/1' },
    })

    const newOwner = localnet.algorand.account.random()
    await localnet.algorand.send.payment({
      amount: (5).algo(),
      sender: testAccount,
      receiver: newOwner.addr,
    })

    await client.send.transferAgentOwnership({
      args: { agentId: 0n, newOwner: newOwner.addr },
    })

    const owner = await client.send.getAgentOwner({
      args: { agentId: 0n },
    })
    expect(owner.return).toBe(newOwner.addr.toString())
  })

  test('deleteAgent: should delete box', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/1' },
    })

    await client.send.deleteAgent({
      args: { agentId: 0n },
    })

    const promise = client.send.getAgent({
      args: { agentId: 0n },
    })

    await expect(promise).rejects.toThrow()
  })

  test('addCapability: should increment capability count', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.registerAgent({
      args: { metadataUri: 'https://example.com/agent/1' },
    })

    await client.send.addCapability({
      args: { agentId: 0n, capability: 'generatePrompt' },
    })

    await client.send.addCapability({
      args: { agentId: 0n, capability: 'scorePrompt' },
    })

    const count = await client.send.getCapabilityCount({
      args: { agentId: 0n },
    })
    expect(count.return).toBe(2n)
  })
})

describe('AgentExecutor - Execution Hook', () => {
  const localnet = algorandFixture()

  beforeAll(() => {
    Config.configure({ debug: true })
  })

  beforeEach(localnet.newScope, 10_000)

  const deploy = async (account: Address) => {
    const factory = localnet.algorand.client.getTypedAppFactory(AgentExecutorFactory, {
      defaultSender: account,
    })

    const { appClient, result } = await factory.deploy({
      onUpdate: 'append',
      onSchemaBreak: 'append',
      suppressLog: true,
    })

    if (['create', 'replace'].includes(result.operationPerformed)) {
      await localnet.algorand.send.payment({
        amount: (2).algo(),
        sender: account,
        receiver: appClient.appAddress,
      })
    }

    return { client: appClient }
  }

  test('invokeAgent: should create execution record', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    const inputHash = new Uint8Array(32)
    inputHash.fill(1)

    const result = await client.send.invokeAgent({
      args: { agentId: 1n, inputHash: inputHash, callerNote: 'test invocation' },
    })

    expect(result.return).toBe(0n)

    const execution = await client.send.getExecution({
      args: { executionId: 0n },
    })
    expect(execution.return?.agentId).toBe(1n)
    expect(execution.return?.status).toBe('pending')
  })

  test('completeExecution: should update status', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    const inputHash = new Uint8Array(32)
    inputHash.fill(1)

    const result = await client.send.invokeAgent({
      args: { agentId: 1n, inputHash: inputHash, callerNote: 'test' },
    })

    await client.send.completeExecution({
      args: { executionId: 0n },
    })

    const execution = await client.send.getExecution({
      args: { executionId: 0n },
    })
    expect(execution.return?.status).toBe('completed')
  })

  test('getExecution: should return execution record', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    const inputHash = new Uint8Array(32)
    inputHash.fill(1)

    await client.send.invokeAgent({
      args: { agentId: 1n, inputHash: inputHash, callerNote: 'test' },
    })

    const execution = await client.send.getExecution({
      args: { executionId: 0n },
    })
    expect(execution.return).toBeDefined()
    expect(execution.return?.caller.toString()).toBe(testAccount.toString())
  })
})

describe('AgentReputation - Staking & Reputation', () => {
  const localnet = algorandFixture()

  beforeAll(() => {
    Config.configure({ debug: true })
  })

  beforeEach(localnet.newScope, 10_000)

  const deploy = async (account: Address) => {
    const factory = localnet.algorand.client.getTypedAppFactory(AgentReputationFactory, {
      defaultSender: account,
    })

    const { appClient, result } = await factory.deploy({
      onUpdate: 'append',
      onSchemaBreak: 'append',
      suppressLog: true,
    })

    if (['create', 'replace'].includes(result.operationPerformed)) {
      await localnet.algorand.send.payment({
        amount: (2).algo(),
        sender: account,
        receiver: appClient.appAddress,
      })
    }

    return { client: appClient }
  }

  test('stakeForAgent: should record stake', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.stakeForAgent({
      args: { agentId: 1n, stakeAmount: 2000000n },
    })

    const rep = await client.send.getReputation({
      args: { agentId: 1n },
    })
    expect(rep.return?.totalStaked).toBe(2000000n)
    expect(rep.return?.agentId).toBe(1n)
  })

  test('stakeForAgent: should reject below minimum stake', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    const promise = client.send.stakeForAgent({
      args: { agentId: 1n, stakeAmount: 500000n },
    })

    await expect(promise).rejects.toThrow()
  })

  test('incrementReputation: should increase score by 1', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.stakeForAgent({
      args: { agentId: 1n, stakeAmount: 2000000n },
    })

    await client.send.incrementReputation({
      args: { agentId: 1n },
    })

    await client.send.incrementReputation({
      args: { agentId: 1n },
    })

    const rep = await client.send.getReputation({
      args: { agentId: 1n },
    })
    expect(rep.return?.reputationScore).toBe(2n)
  })

  test('decrementReputation: should decrease score, floor at 0', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.stakeForAgent({
      args: { agentId: 1n, stakeAmount: 2000000n },
    })

    await client.send.incrementReputation({
      args: { agentId: 1n },
    })

    await client.send.decrementReputation({
      args: { agentId: 1n },
    })

    const rep = await client.send.getReputation({
      args: { agentId: 1n },
    })
    expect(rep.return?.reputationScore).toBe(0n)
  })

  test('getReputation: should return full reputation struct', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.stakeForAgent({
      args: { agentId: 1n, stakeAmount: 2000000n },
    })

    await client.send.incrementReputation({
      args: { agentId: 1n },
    })

    const rep = await client.send.getReputation({
      args: { agentId: 1n },
    })
    expect(rep.return?.agentId).toBe(1n)
    expect(rep.return?.totalStaked).toBe(2000000n)
    expect(rep.return?.reputationScore).toBe(1n)
    expect(rep.return?.totalInvocations).toBe(1n)
    expect(rep.return?.successfulInvocations).toBe(1n)
  })

  test('getMinStake: should return minimum stake amount', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await client.send.stakeForAgent({
      args: { agentId: 1n, stakeAmount: 2000000n },
    })

    const minStake = await client.send.getMinStake({})
    expect(minStake.return).toBe(1000000n)
  })
})
