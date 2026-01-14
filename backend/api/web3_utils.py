from web3 import Web3
from eth_account import Account
from .abis import ERC20_ABI, ESCROW_ABI

# ==========================================
# HARDCODED CONFIGURATION
# ==========================================
RPC_URL = "https://rpc-amoy.polygon.technology"
TOKEN_ADDRESS = "0x48B0DB4e87D280AFB3fDC572f61A641E7261D74D"
ESCROW_ADDRESS = "0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae"
OWNER_PRIVATE_KEY = "ce60907eb0556287ec1452c7c625cd93daf1f376392ad0e5dc6159e9502d3765"
OWNER_ADDRESS = Web3.to_checksum_address("0x7f06ccb5869a837c73a63b899388f9a256d5d12d")

class Web3Manager:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.token_contract = self.w3.eth.contract(address=TOKEN_ADDRESS, abi=ERC20_ABI)
        self.escrow_contract = self.w3.eth.contract(address=ESCROW_ADDRESS, abi=ESCROW_ABI)

    def create_wallet(self):
        """Generates a new random wallet."""
        account = Account.create()
        return account.address, account.key.hex()

    def get_balance(self, address):
        """Gets token balance for an address."""
        if not self.w3.is_connected(): return 0
        try:
            balance_wei = self.token_contract.functions.balanceOf(address).call()
            return balance_wei / 10**18
        except Exception as e:
            print(f"Error fetching balance: {e}")
            return 0

    def get_matic_balance(self, address):
        """Gets native MATIC balance."""
        if not self.w3.is_connected(): return 0
        try:
            balance_wei = self.w3.eth.get_balance(address)
            return balance_wei / 10**18
        except Exception as e:
            print(f"Error fetching MATIC balance: {e}")
            return 0

    def send_matic(self, to_address, amount):
        """Sends MATIC from Owner to Address for Gas Fees."""
        if not self.w3.is_connected(): return None
        try:
            account = Account.from_key(OWNER_PRIVATE_KEY)
            nonce = self.w3.eth.get_transaction_count(account.address)
            amount_wei = int(amount * 10**18)
            
            tx = {
                'nonce': nonce,
                'to': to_address,
                'value': amount_wei,
                'gas': 21000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': self.w3.eth.chain_id
            }

            signed_tx = self.w3.eth.account.sign_transaction(tx, OWNER_PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            return self.w3.to_hex(tx_hash)
        except Exception as e:
            print(f"Sending MATIC failed: {e}")
            return None

    def mint_token(self, to_address, amount):
        """Mints tokens to a user using the Owner's private key."""
        if not self.w3.is_connected(): return None

        try:
            account = Account.from_key(OWNER_PRIVATE_KEY)
            nonce = self.w3.eth.get_transaction_count(account.address)
            amount_wei = int(amount * 10**18)

            tx = self.token_contract.functions.mint(to_address, amount_wei).build_transaction({
                'chainId': self.w3.eth.chain_id,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })

            signed_tx = self.w3.eth.account.sign_transaction(tx, OWNER_PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            return self.w3.to_hex(tx_hash)
        except Exception as e:
            print(f"Minting failed: {e}")
            return None

    def transfer_token(self, from_private_key, to_address, amount):
        """Transfers tokens from one user to another."""
        if not self.w3.is_connected(): return None

        try:
            account = Account.from_key(from_private_key)
            nonce = self.w3.eth.get_transaction_count(account.address)
            amount_wei = int(amount * 10**18)

            tx = self.token_contract.functions.transfer(to_address, amount_wei).build_transaction({
                'chainId': self.w3.eth.chain_id,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })

            signed_tx = self.w3.eth.account.sign_transaction(tx, from_private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            hash_str = self.w3.to_hex(tx_hash)
            print(f"Transfer Successful! Hash: {hash_str}")
            return hash_str
        except Exception as e:
            print(f"Transfer failed: {e}")
            return None

    def wait_for_receipt(self, tx_hash):
        """Waits for transaction to be mined."""
        if not self.w3.is_connected() or not tx_hash: return None
        try:
            print(f"Waiting for updated transaction {tx_hash} to be mined...")
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            print(f"Transaction {tx_hash} mined in block {receipt['blockNumber']}")
            return receipt
        except Exception as e:
            print(f"Error waiting for receipt: {e}")
            return None
