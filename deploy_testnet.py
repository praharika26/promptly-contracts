import os
import sys
import asyncio
from algorand_utils import AlgorandClient
from artifacts.agent_registry import AgentRegistryClient, AgentExecutorClient, AgentReputationClient

async def deploy():
    print("=== Deploying to Testnet ===")
    
    algorand = AlgorandClient.from_environment('testnet')
    deployer = algorand.account.from_mnemonic(os.environ.get('DEPLOYER_MNEMONIC', ''))
    
    print(f"Deployer: {deployer.address}")
    
    # Deploy AgentRegistry
    print("\nDeploying AgentRegistry...")
    registry_factory = algorand.client.get_app_factory(AgentRegistryClient, sender=deployer.address)
    registry_client, registry_result = await registry_factory.deploy(
        on_update='append',
        on_schema_break='append',
        create_params={'method': 'create', 'args': []}
    )
    print(f"AgentRegistry App ID: {registry_client.app_id}")
    
    # Deploy AgentExecutor
    print("\nDeploying AgentExecutor...")
    executor_factory = algorand.client.get_app_factory(AgentExecutorClient, sender=deployer.address)
    executor_client, executor_result = await executor_factory.deploy(
        on_update='append',
        on_schema_break='append',
        create_params={'method': 'create', 'args': []}
    )
    print(f"AgentExecutor App ID: {executor_client.app_id}")
    
    # Deploy AgentReputation
    print("\nDeploying AgentReputation...")
    reputation_factory = algorand.client.get_app_factory(AgentReputationClient, sender=deployer.address)
    reputation_client, reputation_result = await reputation_factory.deploy(
        on_update='append',
        on_schema_break='append',
        create_params={'method': 'create', 'args': []}
    )
    print(f"AgentReputation App ID: {reputation_client.app_id}")
    
    print("\n=== Deployment Complete ===")
    print(f"Registry: {registry_client.app_id}")
    print(f"Executor: {executor_client.app_id}")
    print(f"Reputation: {reputation_client.app_id}")

if __name__ == '__main__':
    asyncio.run(deploy())
