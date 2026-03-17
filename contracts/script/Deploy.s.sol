// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../src/AltriumRegistry.sol";
import "../src/EmployerAccessManager.sol";
import "../src/AltriumDegreeSBT.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);

        // 1. Deploy Degree SBT (custodied + soulbound)
        AltriumDegreeSBT degree = new AltriumDegreeSBT(deployer, deployer);
        console.log("AltriumDegreeSBT deployed at:", address(degree));

        // 2. Deploy Employer access manager (request/approve)
        EmployerAccessManager accessManager = new EmployerAccessManager(deployer);
        console.log("EmployerAccessManager deployed at:", address(accessManager));

        // 3. Deploy Registry (RBAC + orchestration)
        AltriumRegistry registry = new AltriumRegistry(deployer, address(degree), address(accessManager));
        console.log("AltriumRegistry deployed at:", address(registry));

        // 4. Allow registry to mint degrees
        degree.grantRole(degree.MINTER_ROLE(), address(registry));
        
        vm.stopBroadcast();
    }
}
