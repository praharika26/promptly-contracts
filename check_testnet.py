import json
from algosdk import account, mnemonic
from algosdk.v2client import algod

MNEMONIC = "toy inherit clever cave skirt alcohol flight muscle congress viable label aim great cycle easily palace blame crash endless marble pause category tissue absent one"

private_key = mnemonic.to_private_key(MNEMONIC)
address = account.address_from_private_key(private_key)

print(f"Address: {address}")

algod_client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")

info = algod_client.account_info(address)
balance = info.get('amount', 0) / 1_000_000
print(f"Balance: {balance} ALGO")

assets = info.get('assets', [])
print(f"Assets: {len(assets)}")
for asset in assets:
    if asset.get('asset-id') == 10458941:
        print(f"USDC (10458941): {asset.get('amount', 0) / 1_000_000}")
