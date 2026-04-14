import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AgentRegistryFactory } from '../artifacts/agent_registry/AgentRegistryClient'
import { AgentExecutorFactory } from '../artifacts/agent_registry/AgentExecutorClient'
import { AgentReputationFactory } from '../artifacts/agent_registry/AgentReputationClient'

const NETWORK = process.env.NETWORK || 'testnet';

export async function deploy() {
  console.log(`=== Deploying Promptly Agent Registry Contracts (${NETWORK}) ===`)

  let algorand: AlgorandClient;
  let environment: string;
  
  if (NETWORK === 'localnet') {
    algorand = AlgorandClient.defaultLocalNet();
    environment = 'localnet';
  } else {
    algorand = AlgorandClient.fromEnvironment({ network: NETWORK });
    environment = NETWORK;
  }
  
  const deployer = await algorand.account.fromEnvironment('DEPLOYER', { environment })
  
  console.log(`Deployer: ${deployer.addr}`)

  console.log('\nDeploying AgentRegistry...')
  const registryFactory = algorand.client.getTypedAppFactory(AgentRegistryFactory, {
    defaultSender: deployer.addr,
  })
  const { appClient: registryClient, result: registryResult } = await registryFactory.deploy({
    onUpdate: 'append',
    onSchemaBreak: 'append',
    createParams: {
      method: 'create',
      args: [],
    },
  })

  if (['create', 'replace'].includes(registryResult.operationPerformed)) {
    console.log(`AgentRegistry deployed with App ID: ${registryClient.appId}`)
  } else {
    console.log(`AgentRegistry already exists with App ID: ${registryClient.appId}`)
  }

  console.log('\nDeploying AgentExecutor...')
  const executorFactory = algorand.client.getTypedAppFactory(AgentExecutorFactory, {
    defaultSender: deployer.addr,
  })
  const { appClient: executorClient, result: executorResult } = await executorFactory.deploy({
    onUpdate: 'append',
    onSchemaBreak: 'append',
    createParams: {
      method: 'create',
      args: [],
    },
  })

  if (['create', 'replace'].includes(executorResult.operationPerformed)) {
    console.log(`AgentExecutor deployed with App ID: ${executorClient.appId}`)
  } else {
    console.log(`AgentExecutor already exists with App ID: ${executorClient.appId}`)
  }

  console.log('\nDeploying AgentReputation...')
  const reputationFactory = algorand.client.getTypedAppFactory(AgentReputationFactory, {
    defaultSender: deployer.addr,
  })
  const { appClient: reputationClient, result: reputationResult } = await reputationFactory.deploy({
    onUpdate: 'append',
    onSchemaBreak: 'append',
    createParams: {
      method: 'create',
      args: [],
    },
  })

  if (['create', 'replace'].includes(reputationResult.operationPerformed)) {
    console.log(`AgentReputation deployed with App ID: ${reputationClient.appId}`)
  } else {
    console.log(`AgentReputation already exists with App ID: ${reputationClient.appId}`)
  }

  console.log('\n=== Deployment Complete ===')
  console.log(`AgentRegistry App ID: ${registryClient.appId}`)
  console.log(`AgentExecutor App ID: ${executorClient.appId}`)
  console.log(`AgentReputation App ID: ${reputationClient.appId}`)
}