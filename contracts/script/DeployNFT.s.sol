// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../src/AltriumDegreeSBT.sol";

contract DeployNFT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);

        // Standalone deploy of Degree SBT (useful for iterating on NFT only)
        AltriumDegreeSBT degree = new AltriumDegreeSBT(deployer, deployer);
        console.log("AltriumDegreeSBT deployed at:", address(degree));

        vm.stopBroadcast();
    }
}