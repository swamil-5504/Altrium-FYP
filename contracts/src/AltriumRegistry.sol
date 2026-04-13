// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "./AltriumDegreeSBT.sol";

/**
 * @title AltriumRegistry
 * @dev RBAC + orchestration layer for Altrium Degree Verification.
 *
 * Roles:
 * - DEFAULT_ADMIN_ROLE: platform admin (can add/remove universities, set contract addresses)
 * - UNIVERSITY_ROLE: university admin/verifier (can upload degrees, verify degrees, approve employer access)
 *
 * Notes:
 * - JWT auth lives off-chain (FastAPI). On-chain we enforce permissions via roles.
 * - Degrees are soulbound and *indexed by `collegeIdHash`*.
 * - Employers and Students retrieve data via Backend/Web2, mapping PRN -> collegeIdHash.
 */
contract AltriumRegistry is AccessControl {
    bytes32 public constant UNIVERSITY_ROLE = keccak256("UNIVERSITY_ROLE");

    AltriumDegreeSBT public degreeSBT;

    event UniversityAdded(address indexed universityAdmin);
    event UniversityRemoved(address indexed universityAdmin);
    event StudentWalletLinked(bytes32 indexed collegeIdHash, address indexed studentWallet);
    event ContractsUpdated(address indexed degreeSBT);

    constructor(address admin, address _degreeSBT) {
        require(admin != address(0), "admin=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);

        _setContracts(_degreeSBT);
    }

    function _setContracts(address _degreeSBT) internal {
        require(_degreeSBT != address(0), "degreeSBT=0");

        degreeSBT = AltriumDegreeSBT(_degreeSBT);
        emit ContractsUpdated(_degreeSBT);
    }

    function setContracts(address _degreeSBT) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setContracts(_degreeSBT);
    }

    function addUniversity(address universityAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(universityAdmin != address(0), "university=0");
        grantRole(UNIVERSITY_ROLE, universityAdmin);

        // allow them to verify degrees
        degreeSBT.grantRole(degreeSBT.VERIFIER_ROLE(), universityAdmin);

        emit UniversityAdded(universityAdmin);
    }

    function removeUniversity(address universityAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(UNIVERSITY_ROLE, universityAdmin);
        degreeSBT.revokeRole(degreeSBT.VERIFIER_ROLE(), universityAdmin);
        emit UniversityRemoved(universityAdmin);
    }

    /**
     * @dev University uploads a degree (mint) for a student collegeIdHash.
     */
    function uploadDegree(bytes32 collegeIdHash, bytes32 degreeHash, string calldata degreeURI)
        external
        onlyRole(UNIVERSITY_ROLE)
        returns (uint256 tokenId)
    {
        tokenId = degreeSBT.mintDegree(collegeIdHash, msg.sender, msg.sender, degreeHash, degreeURI);
    }

    /**
     * @dev University verifies/unverifies an existing degree.
     */
    function verifyDegree(bytes32 collegeIdHash, bool verified) external onlyRole(UNIVERSITY_ROLE) {
        uint256 tokenId = degreeSBT.tokenIdByCollegeIdHash(collegeIdHash);
        require(tokenId != 0, "degree missing");
        degreeSBT.setVerified(tokenId, verified);
    }

    /**
     * @notice Permanently revoke a degree credential on-chain.
     * @dev Only callable by UNIVERSITY_ROLE. Revocation is irreversible and emits
     *      a DegreeRevoked event that is permanently readable on Etherscan.
     *      The token is NOT burned — revocation history is preserved on-chain.
     */
    function revokeDegree(bytes32 collegeIdHash) external onlyRole(UNIVERSITY_ROLE) {
        uint256 tokenId = degreeSBT.tokenIdByCollegeIdHash(collegeIdHash);
        require(tokenId != 0, "degree missing");
        degreeSBT.revokeDegree(tokenId);
    }

    /**
     * @notice Permanently burn a degree token and clear its record.
     * @dev Only callable by UNIVERSITY_ROLE. Used to "reset" a minted credential.
     */
    function burnDegree(bytes32 collegeIdHash) external onlyRole(UNIVERSITY_ROLE) {
        uint256 tokenId = degreeSBT.tokenIdByCollegeIdHash(collegeIdHash);
        require(tokenId != 0, "degree missing");
        degreeSBT.burnDegree(tokenId);
    }

    /**
     * @notice Public read: check if a degree has been revoked on-chain.
     */
    function isDegreeRevoked(bytes32 collegeIdHash) external view returns (bool) {
        return degreeSBT.isRevoked(collegeIdHash);
    }

    /**
     * @dev Public read of degree record by PRN hash.
     * Employer access logic is handled off-chain via Web2 login.
     */
    function getDegree(bytes32 collegeIdHash)
        external
        view
        returns (bool exists, uint256 tokenId, AltriumDegreeSBT.DegreeRecord memory record, string memory degreeURI)
    {
        return degreeSBT.getDegreeByCollegeIdHash(collegeIdHash);
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

