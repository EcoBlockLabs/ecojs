/*
 * Copyright 2021, Offchain Labs, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-env node */
'use strict'

import { SignerOrProvider, SignerProviderUtils } from './signerOrProvider'
import { ArbSdkError } from './errors'
import { SEVEN_DAYS_IN_SECONDS } from './constants'

export interface L1Network extends Network {
  partnerChainIDs: number[]
  blockTime: number //seconds
  isArbitrum: false
}

export interface L2Network extends Network {
  tokenBridge: TokenBridge
  ethBridge: EthBridge
  partnerChainID: number
  isArbitrum: true
  confirmPeriodBlocks: number
  retryableLifetimeSeconds: number
  nitroGenesisBlock: number
  nitroGenesisL1Block: number
  /**
   * How long to wait (ms) for a deposit to arrive on l2 before timing out a request
   */
  depositTimeout: number
}
export interface Network {
  chainID: number
  name: string
  explorerUrl: string
  rpcUrl: string
  gif?: string
  isCustom: boolean
}

export interface TokenBridge {
  l1GatewayRouter: string
  l2GatewayRouter: string
  l1ERC20Gateway: string
  l2ERC20Gateway: string
  l1CustomGateway: string
  l2CustomGateway: string
  l1WethGateway: string
  l2WethGateway: string
  l2Weth: string
  l1Weth: string
  l1ProxyAdmin: string
  l2ProxyAdmin: string
  l1MultiCall: string
  l2Multicall: string
}

export interface EthBridge {
  bridge: string
  inbox: string
  sequencerInbox: string
  outbox: string
  rollup: string
  classicOutboxes?: {
    [addr: string]: number
  }
}

export interface L1Networks {
  [id: string]: L1Network
}

export interface L2Networks {
  [id: string]: L2Network
}

export const l1Networks: L1Networks = {
  1: {
    chainID: 1,
    name: 'Mainnet',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: process.env['L1_MAINNET_RPC_URL']
      ? process.env['L1_MAINNET_RPC_URL']
      : 'https://rpc.ankr.com/eth',
    partnerChainIDs: [620],
    blockTime: 14,
    isCustom: false,
    isArbitrum: false,
  },
  11155111: {
    blockTime: 12,
    chainID: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: process.env['L1_SEPOLIA_RPC_URL']
      ? process.env['L1_SEPOLIA_RPC_URL']
      : 'https://rpc.sepolia.org',
    isCustom: false,
    name: 'Sepolia',
    partnerChainIDs: [621],
    isArbitrum: false,
  },
}

export const l2Networks: L2Networks = {
  620: {
    chainID: 620,
    confirmPeriodBlocks: 0,
    // Todo update when mainnet golive
    ethBridge: {
      bridge: '',
      inbox: '',
      outbox: '',
      rollup: '',
      sequencerInbox: '',
    },
    explorerUrl: 'https://ecoscan.io',
    rpcUrl: process.env['L2_ECOBLOCK_MAINNET_RPC_URL']
      ? process.env['L2_ECOBLOCK_MAINNET_RPC_URL']
      : 'https://rpc.ecoblock.tech',
    isArbitrum: true,
    isCustom: false,
    name: 'EcoBlock',
    partnerChainID: 1,
    retryableLifetimeSeconds: SEVEN_DAYS_IN_SECONDS,
    tokenBridge: {
      l1CustomGateway: '0x23122da8C581AA7E0d07A36Ff1f16F799650232f',
      l1ERC20Gateway: '0xB2535b988dcE19f9D71dfB22dB6da744aCac21bf',
      l1GatewayRouter: '0xC840838Bc438d73C16c2f8b22D2Ce3669963cD48',
      l1MultiCall: '0x8896d23afea159a5e9b72c9eb3dc4e2684a38ea3',
      l1ProxyAdmin: '0xa8f7DdEd54a726eB873E98bFF2C95ABF2d03e560',
      l1Weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      l1WethGateway: '0xE4E2121b479017955Be0b175305B35f312330BaE',
      l2CustomGateway: '0xbf544970E6BD77b21C6492C281AB60d0770451F4',
      l2ERC20Gateway: '0xcF9bAb7e53DDe48A6DC4f286CB14e05298799257',
      l2GatewayRouter: '0x21903d3F8176b1a0c17E953Cd896610Be9fFDFa8',
      l2Multicall: '0x5e1eE626420A354BbC9a95FeA1BAd4492e3bcB86',
      l2ProxyAdmin: '0xada790b026097BfB36a5ed696859b97a96CEd92C',
      l2Weth: '0x722E8BdD2ce80A4422E880164f2079488e115365',
      l2WethGateway: '0x7626841cB6113412F9c88D3ADC720C9FAC88D9eD',
    },
    nitroGenesisBlock: 0,
    nitroGenesisL1Block: 0,
    /**
     * Finalisation on mainnet can be up to 2 epochs = 64 blocks on mainnet
     * We add 10 minutes for the system to create and redeem the ticket, plus some extra buffer of time
     * (Total timeout: 30 minutes)
     */
    depositTimeout: 1800000,
  },
  621: {
    chainID: 621,
    confirmPeriodBlocks: 0,
    ethBridge: {
      bridge: '0x043d53d7883f81c947963f11d25130b97061c22a',
      inbox: '0xe44f80a5d59975e058b33cd62569b4ae2cbe30e1',
      outbox: '0xd7560ec4ec67350830222c616f590cb3efce2347', // in the internal tx of createRollup tx
      rollup: '0x8da4f0c8e6ffb168a6e9ae75af2866a9d24ae30c',
      sequencerInbox: '0xc5eca22b8f79a11bde3f304021b7e6abbf60f851',
    },
    explorerUrl: 'https://testnet.ecoscan.io',
    rpcUrl: process.env['L2_ECOBLOCK_TESTNET_RPC_URL']
      ? process.env['L2_ECOBLOCK_TESTNET_RPC_URL']
      : 'https://rpc.ecoblock.tech',
    isArbitrum: true,
    isCustom: false,
    name: 'EcoBlock Testnet',
    partnerChainID: 11155111,
    retryableLifetimeSeconds: SEVEN_DAYS_IN_SECONDS,
    // Todo update when token bridge ready
    tokenBridge: {
      l1CustomGateway: '',
      l1ERC20Gateway: '',
      l1GatewayRouter: '',
      l1MultiCall: '',
      l1ProxyAdmin: '',
      l1Weth: '',
      l1WethGateway: '',
      l2CustomGateway: '',
      l2ERC20Gateway: '',
      l2GatewayRouter: '',
      l2Multicall: '',
      l2ProxyAdmin: '',
      l2Weth: '',
      l2WethGateway: '',
    },
    nitroGenesisBlock: 0,
    nitroGenesisL1Block: 0,
    /**
     * Finalisation on mainnet can be up to 2 epochs = 64 blocks on mainnet
     * We add 10 minutes for the system to create and redeem the ticket, plus some extra buffer of time
     * (Total timeout: 30 minutes)
     */
    depositTimeout: 1800000,
  },
}

const getNetwork = async (
  signerOrProviderOrChainID: SignerOrProvider | number,
  layer: 1 | 2
) => {
  const chainID = await (async () => {
    if (typeof signerOrProviderOrChainID === 'number') {
      return signerOrProviderOrChainID
    }
    const provider = SignerProviderUtils.getProviderOrThrow(
      signerOrProviderOrChainID
    )

    const { chainId } = await provider.getNetwork()
    return chainId
  })()

  const networks = layer === 1 ? l1Networks : l2Networks
  if (networks[chainID]) {
    return networks[chainID]
  } else {
    throw new ArbSdkError(`Unrecognized network ${chainID}.`)
  }
}

export const getL1Network = (
  signerOrProviderOrChainID: SignerOrProvider | number
): Promise<L1Network> => {
  return getNetwork(signerOrProviderOrChainID, 1) as Promise<L1Network>
}
export const getL2Network = (
  signerOrProviderOrChainID: SignerOrProvider | number
): Promise<L2Network> => {
  return getNetwork(signerOrProviderOrChainID, 2) as Promise<L2Network>
}

export const addCustomNetwork = ({
  customL1Network,
  customL2Network,
}: {
  customL1Network?: L1Network
  customL2Network: L2Network
}): void => {
  if (customL1Network) {
    if (l1Networks[customL1Network.chainID]) {
      throw new ArbSdkError(
        `Network ${customL1Network.chainID} already included`
      )
    } else if (!customL1Network.isCustom) {
      throw new ArbSdkError(
        `Custom network ${customL1Network.chainID} must have isCustom flag set to true`
      )
    } else {
      l1Networks[customL1Network.chainID] = customL1Network
    }
  }

  if (l2Networks[customL2Network.chainID])
    throw new ArbSdkError(`Network ${customL2Network.chainID} already included`)
  else if (!customL2Network.isCustom) {
    throw new ArbSdkError(
      `Custom network ${customL2Network.chainID} must have isCustom flag set to true`
    )
  }

  l2Networks[customL2Network.chainID] = customL2Network

  const l1PartnerChain = l1Networks[customL2Network.partnerChainID]
  if (!l1PartnerChain)
    throw new ArbSdkError(
      `Network ${customL2Network.chainID}'s partner network, ${customL2Network.partnerChainID}, not recognized`
    )

  if (!l1PartnerChain.partnerChainIDs.includes(customL2Network.chainID)) {
    l1PartnerChain.partnerChainIDs.push(customL2Network.chainID)
  }
}

/**
 * Registers a custom network that matches the one created by a Nitro local node. Useful in development.
 *
 * @see {@link https://github.com/OffchainLabs/nitro}
 */
export const addDefaultLocalNetwork = (): {
  l1Network: L1Network
  l2Network: L2Network
} => {
  const defaultLocalL1Network: L1Network = {
    blockTime: 10,
    chainID: 1337,
    explorerUrl: '',
    rpcUrl: '',
    isCustom: true,
    name: 'EthLocal',
    partnerChainIDs: [412346],
    isArbitrum: false,
  }

  const defaultLocalL2Network: L2Network = {
    chainID: 412346,
    confirmPeriodBlocks: 20,
    ethBridge: {
      bridge: '0x2b360a9881f21c3d7aa0ea6ca0de2a3341d4ef3c',
      inbox: '0xff4a24b22f94979e9ba5f3eb35838aa814bad6f1',
      outbox: '0x49940929c7cA9b50Ff57a01d3a92817A414E6B9B',
      rollup: '0x65a59d67da8e710ef9a01eca37f83f84aedec416',
      sequencerInbox: '0xe7362d0787b51d8c72d504803e5b1d6dcda89540',
    },
    explorerUrl: '',
    rpcUrl: '',
    isArbitrum: true,
    isCustom: true,
    name: 'ArbLocal',
    partnerChainID: 1337,
    retryableLifetimeSeconds: 604800,
    nitroGenesisBlock: 0,
    nitroGenesisL1Block: 0,
    depositTimeout: 900000,
    tokenBridge: {
      l1CustomGateway: '0x3DF948c956e14175f43670407d5796b95Bb219D8',
      l1ERC20Gateway: '0x4A2bA922052bA54e29c5417bC979Daaf7D5Fe4f4',
      l1GatewayRouter: '0x525c2aBA45F66987217323E8a05EA400C65D06DC',
      l1MultiCall: '0xDB2D15a3EB70C347E0D2C2c7861cAFb946baAb48',
      l1ProxyAdmin: '0xe1080224B632A93951A7CFA33EeEa9Fd81558b5e',
      l1Weth: '0x408Da76E87511429485C32E4Ad647DD14823Fdc4',
      l1WethGateway: '0xF5FfD11A55AFD39377411Ab9856474D2a7Cb697e',
      l2CustomGateway: '0x525c2aBA45F66987217323E8a05EA400C65D06DC',
      l2ERC20Gateway: '0xe1080224B632A93951A7CFA33EeEa9Fd81558b5e',
      l2GatewayRouter: '0x1294b86822ff4976BfE136cB06CF43eC7FCF2574',
      l2Multicall: '0xDB2D15a3EB70C347E0D2C2c7861cAFb946baAb48',
      l2ProxyAdmin: '0xda52b25ddB0e3B9CC393b0690Ac62245Ac772527',
      l2Weth: '0x408Da76E87511429485C32E4Ad647DD14823Fdc4',
      l2WethGateway: '0x4A2bA922052bA54e29c5417bC979Daaf7D5Fe4f4',
    },
  }

  addCustomNetwork({
    customL1Network: defaultLocalL1Network,
    customL2Network: defaultLocalL2Network,
  })

  return {
    l1Network: defaultLocalL1Network,
    l2Network: defaultLocalL2Network,
  }
}

export const isL1Network = (
  network: L1Network | L2Network
): network is L1Network => {
  if ((network as L1Network).partnerChainIDs) return true
  else return false
}
