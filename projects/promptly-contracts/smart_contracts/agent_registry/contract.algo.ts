import {
  Contract,
  GlobalState,
  BoxMap,
  Account,
  uint64,
  Uint64,
  bytes,
  assert,
  clone,
  itxn,
  Txn,
} from '@algorandfoundation/algorand-typescript'
import { abimethod } from '@algorandfoundation/algorand-typescript/arc4'

export type Agent = {
  agentId: uint64
  owner: Account
  metadataURI: string
  active: boolean
  createdAt: uint64
  updatedAt: uint64
  capabilityCount: uint64
}

export type Execution = {
  executionId: uint64
  agentId: uint64
  caller: Account
  inputHash: bytes
  timestamp: uint64
  status: string
  outputExists: boolean
}

export type Reputation = {
  agentId: uint64
  reputationScore: uint64
  totalStaked: uint64
  totalInvocations: uint64
  successfulInvocations: uint64
  lastUpdated: uint64
}

const AGENT_PREFIX = 'ag'
const EXEC_PREFIX = 'ex'
const REP_PREFIX = 're'
const MIN_STAKE = Uint64(1000000)

export class AgentRegistry extends Contract {
  nextAgentId = GlobalState<uint64>({ key: 'nextAgentId' })
  totalAgents = GlobalState<uint64>({ key: 'totalAgents' })
  registryOwner = GlobalState<Account>({ key: 'registryOwner' })

  agents = BoxMap<uint64, Agent>({ keyPrefix: AGENT_PREFIX })
  
  @abimethod({ allowActions: 'NoOp', onCreate: 'require' })
  public create(): void {
    this.nextAgentId.value = Uint64(1)
    this.totalAgents.value = Uint64(0)
    this.registryOwner.value = Txn.sender
  }

  @abimethod()
  public registerAgent(metadataURI: string): uint64 {
    assert(metadataURI !== '', 'Metadata URI cannot be empty')

    const agentId = clone(this.nextAgentId.value)
    const sender = Txn.sender
    const timestamp = Txn.firstValidTime

    const newAgent: Agent = {
      agentId: agentId,
      owner: sender,
      metadataURI: metadataURI,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      capabilityCount: 0,
    }

    this.agents(agentId).value = clone(newAgent)

    this.nextAgentId.value = agentId + Uint64(1)

    const currentTotal = clone(this.totalAgents.value)
    this.totalAgents.value = currentTotal + Uint64(1)

    return agentId
  }

  @abimethod({ readonly: true })
  public getAgent(agentId: uint64): Agent {
    assert(this.agents(agentId).exists, 'Agent not found')
    return clone(this.agents(agentId).value)
  }

  @abimethod()
  public updateAgent(agentId: uint64, newMetadataURI: string): void {
    assert(this.agents(agentId).exists, 'Agent not found')
    const agent = clone(this.agents(agentId).value)
    assert(Txn.sender === agent.owner, 'Only owner can update')

    assert(newMetadataURI !== '', 'Metadata URI cannot be empty')

    agent.metadataURI = newMetadataURI
    agent.updatedAt = Txn.firstValidTime
    this.agents(agentId).value = clone(agent)
  }

  @abimethod()
  public deactivateAgent(agentId: uint64): void {
    assert(this.agents(agentId).exists, 'Agent not found')
    const agent = clone(this.agents(agentId).value)
    assert(Txn.sender === agent.owner || Txn.sender === this.registryOwner.value, 'Not authorized')

    agent.active = false
    agent.updatedAt = Txn.firstValidTime
    this.agents(agentId).value = clone(agent)
  }

  @abimethod()
  public reactivateAgent(agentId: uint64): void {
    assert(this.agents(agentId).exists, 'Agent not found')
    const agent = clone(this.agents(agentId).value)
    assert(Txn.sender === agent.owner, 'Only owner can reactivate')

    agent.active = true
    agent.updatedAt = Txn.firstValidTime
    this.agents(agentId).value = clone(agent)
  }

  @abimethod()
  public transferAgentOwnership(agentId: uint64, newOwner: Account): void {
    assert(this.agents(agentId).exists, 'Agent not found')
    const agent = clone(this.agents(agentId).value)
    const oldOwner = clone(agent.owner)
    assert(Txn.sender === oldOwner, 'Only owner can transfer')

    agent.owner = newOwner
    agent.updatedAt = Txn.firstValidTime
    this.agents(agentId).value = clone(agent)
  }

  @abimethod()
  public deleteAgent(agentId: uint64): void {
    assert(this.agents(agentId).exists, 'Agent not found')
    const agent = clone(this.agents(agentId).value)
    assert(Txn.sender === agent.owner, 'Only owner can delete')

    this.agents(agentId).delete()
    this.totalAgents.value = this.totalAgents.value - Uint64(1)
  }

  @abimethod({ readonly: true })
  public isAgentActive(agentId: uint64): boolean {
    if (!this.agents(agentId).exists) return false
    return clone(this.agents(agentId).value).active
  }

  @abimethod({ readonly: true })
  public getAgentOwner(agentId: uint64): Account {
    assert(this.agents(agentId).exists, 'Agent not found')
    return clone(this.agents(agentId).value).owner
  }

  @abimethod({ readonly: true })
  public getTotalAgents(): uint64 {
    return clone(this.totalAgents.value)
  }

  @abimethod()
  public addCapability(agentId: uint64, capability: string): void {
    assert(this.agents(agentId).exists, 'Agent not found')
    const agent = clone(this.agents(agentId).value)
    assert(Txn.sender === agent.owner, 'Only owner can add capabilities')
    assert(capability !== '', 'Capability cannot be empty')

    agent.capabilityCount = agent.capabilityCount + Uint64(1)
    this.agents(agentId).value = clone(agent)
  }

  @abimethod({ readonly: true })
  public getCapabilityCount(agentId: uint64): uint64 {
    assert(this.agents(agentId).exists, 'Agent not found')
    return clone(this.agents(agentId).value).capabilityCount
  }
}

export class AgentExecutor extends Contract {
  executionCount = GlobalState<uint64>({ key: 'executionCount' })

  executions = BoxMap<uint64, Execution>({ keyPrefix: EXEC_PREFIX })

  @abimethod({ allowActions: 'NoOp', onCreate: 'require' })
  public create(): void {
    this.executionCount.value = Uint64(0)
  }

  @abimethod()
  public invokeAgent(agentId: uint64, inputHash: bytes, callerNote: string): uint64 {
    this.executionCount.value = Uint64(0)

    const execId = clone(this.executionCount.value)

    const newExecution: Execution = {
      executionId: execId,
      agentId: agentId,
      caller: Txn.sender,
      inputHash: inputHash,
      timestamp: Txn.firstValidTime,
      status: 'pending',
      outputExists: false,
    }

    this.executions(execId).value = clone(newExecution)

    this.executionCount.value = execId + Uint64(1)

    return execId
  }

  @abimethod()
  public completeExecution(executionId: uint64): void {
    assert(this.executions(executionId).exists, 'Execution not found')
    const exec = clone(this.executions(executionId).value)

    exec.status = 'completed'
    exec.outputExists = true
    this.executions(executionId).value = clone(exec)
  }

  @abimethod()
  public failExecution(executionId: uint64): void {
    assert(this.executions(executionId).exists, 'Execution not found')
    const exec = clone(this.executions(executionId).value)

    exec.status = 'failed'
    this.executions(executionId).value = clone(exec)
  }

  @abimethod({ readonly: true })
  public getExecution(executionId: uint64): Execution {
    assert(this.executions(executionId).exists, 'Execution not found')
    return clone(this.executions(executionId).value)
  }

  @abimethod({ readonly: true })
  public getExecutionCount(): uint64 {
    return clone(this.executionCount.value)
  }
}

export class AgentReputation extends Contract {
  minStake = GlobalState<uint64>({ key: 'minStake' })

  reputations = BoxMap<uint64, Reputation>({ keyPrefix: REP_PREFIX })

  @abimethod({ allowActions: 'NoOp', onCreate: 'require' })
  public create(): void {
    this.minStake.value = MIN_STAKE
  }

  @abimethod()
  public stakeForAgent(agentId: uint64, stakeAmount: uint64): void {
    this.minStake.value = MIN_STAKE

    assert(stakeAmount >= this.minStake.value, 'Minimum stake not met')

    let rep: Reputation
    if (!this.reputations(agentId).exists) {
      rep = {
        agentId: agentId,
        reputationScore: Uint64(0),
        totalStaked: Uint64(0),
        totalInvocations: Uint64(0),
        successfulInvocations: Uint64(0),
        lastUpdated: Txn.firstValidTime,
      }
    } else {
      rep = clone(this.reputations(agentId).value)
    }

    rep.totalStaked = rep.totalStaked + stakeAmount
    rep.lastUpdated = Txn.firstValidTime
    this.reputations(agentId).value = clone(rep)
  }

  @abimethod()
  public unstakeFromAgent(agentId: uint64, amount: uint64): void {
    assert(this.reputations(agentId).exists, 'No reputation record')
    const rep = clone(this.reputations(agentId).value)
    assert(rep.totalStaked >= amount, 'Insufficient stake')

    itxn.payment({
      receiver: Txn.sender,
      amount: amount,
      fee: Uint64(1000),
    }).submit()

    rep.totalStaked = rep.totalStaked - amount
    rep.lastUpdated = Txn.firstValidTime
    this.reputations(agentId).value = clone(rep)
  }

  @abimethod()
  public incrementReputation(agentId: uint64): void {
    let rep: Reputation
    if (!this.reputations(agentId).exists) {
      rep = {
        agentId: agentId,
        reputationScore: Uint64(0),
        totalStaked: Uint64(0),
        totalInvocations: Uint64(0),
        successfulInvocations: Uint64(0),
        lastUpdated: Txn.firstValidTime,
      }
    } else {
      rep = clone(this.reputations(agentId).value)
    }

    if (rep.reputationScore < Uint64(1000)) {
      rep.reputationScore = rep.reputationScore + Uint64(1)
    }
    rep.totalInvocations = rep.totalInvocations + Uint64(1)
    rep.successfulInvocations = rep.successfulInvocations + Uint64(1)
    rep.lastUpdated = Txn.firstValidTime
    this.reputations(agentId).value = clone(rep)
  }

  @abimethod()
  public decrementReputation(agentId: uint64): void {
    assert(this.reputations(agentId).exists, 'No reputation record')
    const rep = clone(this.reputations(agentId).value)

    if (rep.reputationScore > Uint64(0)) {
      rep.reputationScore = rep.reputationScore - Uint64(1)
    }
    rep.totalInvocations = rep.totalInvocations + Uint64(1)
    rep.lastUpdated = Txn.firstValidTime
    this.reputations(agentId).value = clone(rep)
  }

  @abimethod({ readonly: true })
  public getReputation(agentId: uint64): Reputation {
    let rep: Reputation
    if (!this.reputations(agentId).exists) {
      rep = {
        agentId: agentId,
        reputationScore: Uint64(0),
        totalStaked: Uint64(0),
        totalInvocations: Uint64(0),
        successfulInvocations: Uint64(0),
        lastUpdated: Uint64(0),
      }
    } else {
      rep = clone(this.reputations(agentId).value)
    }
    return rep
  }

  @abimethod({ readonly: true })
  public getMinStake(): uint64 {
    return MIN_STAKE
  }
}
