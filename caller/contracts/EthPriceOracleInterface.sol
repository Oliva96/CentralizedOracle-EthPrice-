// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

interface EthPriceOracleInterface {
  function getLatestEthPrice() external returns (uint);
}