import os
import json
import base64
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

MNEMONIC = "toy inherit clever cave skirt alcohol flight muscle congress viable label aim great cycle easily palace blame crash endless marble pause category tissue absent one"

private_key = mnemonic.to_private_key(MNEMONIC)
address = account.address_from_private_key(private_key)

print(f"Deployer address: {address}")

algod_client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")

# Get suggested params
params = algod_client.suggested_params()
print(f"Current round: {params.first}")

# Read contract artifacts
def read_teal(path):
    with open(path, 'r') as f:
        return f.read()

def deploy_contract(name, approval_teal_path, clear_teal_path):
    print(f"\n=== Deploying {name} ===")
    
    approval_teal = read_teal(approval_teal_path)
    clear_teal = read_teal(clear_teal_path)
    
    # Create application
    txn = transaction.ApplicationCreateTxn(
        sender=address,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_teal.encode(),
        clear_program=clear_teal.encode(),
        global_schema=transaction.StateSchema(num_uints=10, num_byte_slices=10),
        local_schema=transaction.StateSchema(num_uints=0, num_byte_slices=0)
    )
    
    # Sign
    signed_txn = txn.sign(private_key)
    
    # Send
    txid = signed_txn.transaction.get_txid()
    try:
        algod_client.send_transactions([signed_txn])
        print(f"Sent: {txid}")
        
        # Wait for confirmation
        confirmed = transaction.wait_for_confirmation(algod_client, txid, wait_rounds=10)
        app_id = confirmed['application-index']
        print(f"Deployed {name} with App ID: {app_id}")
        return app_id
    except Exception as e:
        print(f"Error deploying {name}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

# Deploy contracts
contracts_dir = "promptly-contracts/projects/promptly-contracts/smart_contracts/artifacts/agent_registry"

registry_id = deploy_contract(
    "AgentRegistry",
    f"{contracts_dir}/AgentRegistry.approval.teal",
    f"{contracts_dir}/AgentRegistry.clear.teal"
)

executor_id = deploy_contract(
    "AgentExecutor",
    f"{contracts_dir}/AgentExecutor.approval.teal",
    f"{contracts_dir}/AgentExecutor.clear.teal"
)

reputation_id = deploy_contract(
    "AgentReputation",
    f"{contracts_dir}/AgentReputation.approval.teal",
    f"{contracts_dir}/AgentReputation.clear.teal"
)

print("\n=== Deployment Summary ===")
print(f"AgentRegistry: {registry_id}")
print(f"AgentExecutor: {executor_id}")
print(f"AgentReputation: {reputation_id}")