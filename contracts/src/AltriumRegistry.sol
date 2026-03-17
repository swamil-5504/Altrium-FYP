// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "./AltriumDegreeSBT.sol";
import "./EmployerAccessManager.sol";

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
 */
contract AltriumRegistry is AccessControl {
    bytes32 public constant UNIVERSITY_ROLE = keccak256("UNIVERSITY_ROLE");

    AltriumDegreeSBT public degreeSBT;
    EmployerAccessManager public accessManager;

    // Optional: link a student wallet to a collegeIdHash so students can read without revealing IDs publicly
    mapping(bytes32 => address) public studentWalletByCollegeIdHash;

    event UniversityAdded(address indexed universityAdmin);
    event UniversityRemoved(address indexed universityAdmin);
    event StudentWalletLinked(bytes32 indexed collegeIdHash, address indexed studentWallet);
    event ContractsUpdated(address indexed degreeSBT, address indexed accessManager);

    constructor(address admin, address _degreeSBT, address _accessManager) {
        require(admin != address(0), "admin=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);

        _setContracts(_degreeSBT, _accessManager);
    }

    function _setContracts(address _degreeSBT, address _accessManager) internal {
        require(_degreeSBT != address(0), "degreeSBT=0");
        require(_accessManager != address(0), "accessManager=0");

        degreeSBT = AltriumDegreeSBT(_degreeSBT);
        accessManager = EmployerAccessManager(_accessManager);
        emit ContractsUpdated(_degreeSBT, _accessManager);
    }

    function setContracts(address _degreeSBT, address _accessManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setContracts(_degreeSBT, _accessManager);
    }

    function addUniversity(address universityAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(universityAdmin != address(0), "university=0");
        grantRole(UNIVERSITY_ROLE, universityAdmin);

        // also allow them to verify degrees + approve employer requests
        degreeSBT.grantRole(degreeSBT.VERIFIER_ROLE(), universityAdmin);
        accessManager.grantRole(accessManager.UNIVERSITY_ROLE(), universityAdmin);

        emit UniversityAdded(universityAdmin);
    }

    function removeUniversity(address universityAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(UNIVERSITY_ROLE, universityAdmin);
        degreeSBT.revokeRole(degreeSBT.VERIFIER_ROLE(), universityAdmin);
        accessManager.revokeRole(accessManager.UNIVERSITY_ROLE(), universityAdmin);
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
        tokenId = degreeSBT.mintDegree(collegeIdHash, msg.sender, degreeHash, degreeURI);
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
     * @dev University links a student wallet to a collegeIdHash (optional convenience for frontends).
     */
    function linkStudentWallet(bytes32 collegeIdHash, address studentWallet) external onlyRole(UNIVERSITY_ROLE) {
        require(collegeIdHash != bytes32(0), "collegeIdHash=0");
        require(studentWallet != address(0), "studentWallet=0");
        studentWalletByCollegeIdHash[collegeIdHash] = studentWallet;
        emit StudentWalletLinked(collegeIdHash, studentWallet);
    }

    /**
     * @dev Employer requests access to a student's credential.
     */
    function requestAccess(bytes32 collegeIdHash, string calldata purpose) external returns (uint256 requestId) {
        requestId = accessManager.requestAccess(collegeIdHash, purpose);
    }

    /**
     * @dev University reviews employer access request.
     */
    function approveEmployerRequest(uint256 requestId) external onlyRole(UNIVERSITY_ROLE) {
        accessManager.approveRequest(requestId);
    }

    function denyEmployerRequest(uint256 requestId) external onlyRole(UNIVERSITY_ROLE) {
        accessManager.denyRequest(requestId);
    }

    function revokeEmployerAccess(bytes32 collegeIdHash, address employer) external onlyRole(UNIVERSITY_ROLE) {
        accessManager.revokeAccess(collegeIdHash, employer);
    }

    /**
     * @dev Fetch degree details for employers *only if access was granted*.
     */
    function getDegreeForEmployer(bytes32 collegeIdHash)
        external
        view
        returns (bool exists, uint256 tokenId, AltriumDegreeSBT.DegreeRecord memory record, string memory degreeURI)
    {
        require(accessManager.accessGranted(collegeIdHash, msg.sender), "access not granted");
        return degreeSBT.getDegreeByCollegeIdHash(collegeIdHash);
    }

    /**
     * @dev Student-friendly read:
     * - If a wallet was linked, only that wallet can read via this method.
     * - Universities/admin can always read.
     */
    function getDegreeForStudent(bytes32 collegeIdHash)
        external
        view
        returns (bool exists, uint256 tokenId, AltriumDegreeSBT.DegreeRecord memory record, string memory degreeURI)
    {
        address linked = studentWalletByCollegeIdHash[collegeIdHash];
        if (linked != address(0)) {
            require(msg.sender == linked, "not linked student");
        } else {
            require(hasRole(UNIVERSITY_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "student not linked");
        }
        return degreeSBT.getDegreeByCollegeIdHash(collegeIdHash);
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

