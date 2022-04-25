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

import { expect } from 'chai'
import { BigNumber } from '@ethersproject/bignumber'
import { TestERC20__factory } from '../src/lib/abi/factories/TestERC20__factory'
import {
  fundL1,
  fundL2,
  skipIfMainnet,
  depositToken,
  GatewayType,
  withdrawToken,
} from './testHelpers'
import {
  Erc20Bridger,
  L1ToL2MessageStatus,
  L1ToL2MessageWriter,
  L2Network,
} from '../src'
import { Signer } from 'ethers'
import { TestERC20 } from '../src/lib/abi/TestERC20'
import { testSetup } from '../scripts/testSetup'
import { ERC20__factory } from '../src/lib/abi/factories/ERC20__factory'
const depositAmount = BigNumber.from(100)
const withdrawalAmount = BigNumber.from(10)

describe('standard ERC20', () => {
  beforeEach('skipIfMainnet', async function () {
    await skipIfMainnet(this)
  })

  // test globals
  let testState: {
    l1Signer: Signer
    l2Signer: Signer
    erc20Bridger: Erc20Bridger
    l2Network: L2Network
    l1Token: TestERC20
  }

  before('init', async () => {
    const setup = await testSetup()
    await fundL1(setup.l1Signer)
    await fundL2(setup.l2Signer)

    const deployErc20 = new TestERC20__factory().connect(setup.l1Signer)
    const testToken = await deployErc20.deploy()
    await testToken.deployed()

    await (await testToken.mint()).wait()

    testState = { ...setup, l1Token: testToken }
  })

  it('deposits erc20', async () => {
    await depositToken(
      depositAmount,
      testState.l1Token.address,
      testState.erc20Bridger,
      testState.l1Signer,
      testState.l2Signer,
      L1ToL2MessageStatus.REDEEMED,
      GatewayType.STANDARD
    )
  })

  const redeemAndTest = async (
    message: L1ToL2MessageWriter,
    expectedStatus: 0 | 1,
    gasLimit?: BigNumber
  ) => {
    const manualRedeem = await message.redeem({ gasLimit })
    const retryRec = await manualRedeem.waitForRedeem()
    const blockHash = (await manualRedeem.wait()).blockHash

    expect(retryRec.blockHash, 'redeemed in same block').to.eq(blockHash)
    expect(retryRec.to, 'redeemed in same block').to.eq(
      testState.l2Network.tokenBridge.l2ERC20Gateway
    )
    expect(retryRec.status, 'tx didnt fail').to.eq(expectedStatus)
  }

  // CHRIS: TODO: gas questions
  // 1. how do we calculate l2gasused - we should have a function for this on the transaction receipt
  // 2. what happens to left over gas from redeem
  // 3. what value is returned when I call NodeInterface.estimateGas - it's the value required to call autoRedeem, but no submission cost
  // 4. is any submission cost paid for plain eth deposits?

  it('deposit with no funds, manual redeem', async () => {
    const { waitRes } = await depositToken(
      depositAmount,
      testState.l1Token.address,
      testState.erc20Bridger,
      testState.l1Signer,
      testState.l2Signer,
      L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2,
      GatewayType.STANDARD,
      {
        gasLimit: { base: BigNumber.from(0) },
        maxFeePerGas: { base: BigNumber.from(0) },
      }
    )

    await redeemAndTest(waitRes.message, 1)
  })

  it('deposit with low funds, manual redeem', async () => {
    const { waitRes } = await depositToken(
      depositAmount,
      testState.l1Token.address,
      testState.erc20Bridger,
      testState.l1Signer,
      testState.l2Signer,
      L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2,
      GatewayType.STANDARD,
      {
        gasLimit: { base: BigNumber.from(5) },
        maxFeePerGas: { base: BigNumber.from(5) },
      }
    )

    await redeemAndTest(waitRes.message, 1)
  })

  it('deposit with low funds, fails first redeem, succeeds seconds', async () => {
    const { waitRes } = await depositToken(
      depositAmount,
      testState.l1Token.address,
      testState.erc20Bridger,
      testState.l1Signer,
      testState.l2Signer,
      L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2,
      GatewayType.STANDARD,
      {
        gasLimit: { base: BigNumber.from(5) },
        maxFeePerGas: { base: BigNumber.from(5) },
      }
    )

    // not enough gas
    await redeemAndTest(waitRes.message, 0, BigNumber.from(130000))
    await redeemAndTest(waitRes.message, 1)
  })

  it('withdraws erc20', async function () {
    const l2TokenAddr = await testState.erc20Bridger.getL2ERC20Address(
      testState.l1Token.address,
      testState.l1Signer.provider!
    )
    const l2Token = testState.erc20Bridger.getL2TokenContract(
      testState.l2Signer.provider!,
      l2TokenAddr
    )
    // 4 deposits above - increase this number if more deposit tests added
    const startBalance = depositAmount.mul(4)
    const l2BalanceStart = await l2Token.balanceOf(
      await testState.l2Signer.getAddress()
    )
    expect(l2BalanceStart.toString(), 'l2 balance start').to.eq(
      l2BalanceStart.toString()
    )

    await withdrawToken({
      ...testState,
      amount: withdrawalAmount,
      gatewayType: GatewayType.STANDARD,
      startBalance: startBalance,
      l1Token: ERC20__factory.connect(
        testState.l1Token.address,
        testState.l1Signer.provider!
      ),
    })
  })
})
