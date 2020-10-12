import * as stringify from 'json-stable-stringify';
import { TransactionReceipt } from '@ethersproject/providers';
import { providers, Contract, Wallet, utils, ContractInterface } from 'ethers';
import { EthAddress } from '../_types/global/GlobalTypes';
import { address } from '../utils/CheckedTypeUtils';
import EventEmitter from 'events';

class EthereumAccountManager extends EventEmitter {
  static instance: EthereumAccountManager | null = null;

  private provider: JsonRpcProvider;
  private signer: Wallet | null;
  private rpcURL: string;
  private defaultRpcURL = 'https://rpc.xdaichain.com/';
  private readonly knownAddresses: EthAddress[];

  private constructor() {
    super();

    // const url = localStorage.getItem('XDAI_RPC_ENDPOINT') || this.defaultRpcURL;
    const url = this.defaultRpcURL;
    this.setRpcEndpoint(url);
    this.knownAddresses = [];
    const knownAddressesStr = localStorage.getItem('KNOWN_ADDRESSES');
    if (knownAddressesStr) {
      const addrStrs = JSON.parse(knownAddressesStr) as string[];
      for (const addrStr of addrStrs) {
        this.knownAddresses.push(address(addrStr));
      }
    }
  }

  static getInstance(): EthereumAccountManager {
    if (!EthereumAccountManager.instance) {
      EthereumAccountManager.instance = new EthereumAccountManager();
    }
    return EthereumAccountManager.instance;
  }

  public getRpcEndpoint(): string {
    return this.rpcURL;
  }

  public async setRpcEndpoint(url: string): Promise<void> {
    try {
      this.rpcURL = url;
      let newProvider;
      if (this.rpcURL.startsWith('ws')) {
        newProvider = new providers.WebSocketProvider(this.rpcURL);
      } else {
        newProvider = new providers.JsonRpcProvider(this.rpcURL);
        newProvider.pollingInterval = 8000;
      }
      // TODO: the chainID check
      this.provider = newProvider;
      if (this.signer) {
        this.signer = new Wallet(this.signer.privateKey, this.provider);
      } else {
        this.signer = null;
      }
      // localStorage.setItem('XDAI_RPC_ENDPOINT', this.rpcURL);
      this.emit('ChangedRPCEndpoint');
    } catch (e) {
      console.error(`error setting rpc endpoint: ${e} - Falling back to default`);
      // localStorage.setItem('XDAI_RPC_ENDPOINT', this.defaultRpcUrl);
      this.setRpcEndpoint(this.defaultRpcUrl);
      return;
    }
  }

  public async loadContract(
    contractAddress: string,
    contractABI: ContractInterface
  ): Promise<Contract> {
    if (this.signer) {
      return new Contract(contractAddress, contractABI, this.signer);
    } else {
      throw new Error('no signer found');
    }
  }

  public async loadCoreContract(): Promise<Contract> {
    const contractABI = (
      await fetch('/public/contracts/DarkForestCore.json').then((x) => x.json())
    ).abi;

    const { contractAddress } = await import('../utils/prod_contract_addr');

    return this.loadContract(contractAddress, contractABI);
  }

  public getAddress(): EthAddress {
    // throws if no account has been set yet
    if (!this.signer) {
      throw new Error('account not selected yet');
    }
    return address(this.signer.address);
  }

  public getNonce(): Promise<number> {
    // throws if no account has been set yet
    if (!this.signer) {
      throw new Error('account not selected yet');
    }
    return this.provider.getTransactionCount(this.signer.address);
  }

  public setAccount(address: EthAddress): void {
    const skey = localStorage.getItem(`skey-${address}`);
    if (skey) {
      this.signer = new Wallet(skey, this.provider);
    } else {
      throw new Error('private key for address not found');
    }
  }

  public addAccount(skey: string): void {
    // throws if invalid secret key
    const addr = address(utils.computeAddress(skey));
    localStorage.setItem(`skey-${addr}`, skey);
    this.knownAddresses.push(addr);
    localStorage.setItem('KNOWN_ADDRESSES', stringify(this.knownAddresses));
  }

  public getKnownAccounts(): EthAddress[] {
    return this.knownAddresses;
  }

  public async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('no signer yet');
    }
    return this.signer.signMessage(message);
  }

  public async getBalance(address: EthAddress): Promise<number> {
    const balanceWeiBN = await this.provider.getBalance(address);
    return parseFloat(utils.formatEther(balanceWeiBN));
  }

  public getPrivateKey(): string {
    if (!this.signer) {
      throw new Error('no signer yet');
    }
    return this.signer.privateKey;
  }

  public async waitForTransaction(txHash: string): Promise<TransactionReceipt> {
    return this.provider.waitForTransaction(txHash);
  }
}

export default EthereumAccountManager;
