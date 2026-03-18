// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/AccessControl.sol";

/**
 * @title EmployerAccessManager
 * @dev On-chain access request + approval state for degree viewing/verification.
 *
 * Employer requests are intentionally lightweight: the request itself is an event + a stored record.
 * Approval is performed by university admins (off-chain RBAC/JWT determines who can call).
 */
contract EmployerAccessManager is AccessControl {
    bytes32 public constant UNIVERSITY_ROLE = keccak256("UNIVERSITY_ROLE");

    enum RequestStatus {
        Pending,
        Approved,
        Denied,
        Revoked
    }

    struct AccessRequest {
        uint256 requestId;
        bytes32 collegeIdHash;
        address employer;
        uint64 requestedAt;
        RequestStatus status;
    }

    uint256 private _requestIdCounter;

    mapping(uint256 => AccessRequest) public requests;
    mapping(bytes32 => mapping(address => bool)) public accessGranted; // collegeIdHash => employer => granted
    mapping(address => uint256[]) public employerRequests; // employer => requestIds

    event AccessRequested(
        uint256 indexed requestId,
        bytes32 indexed collegeIdHash,
        address indexed employer,
        string purpose
    );

    event AccessReviewed(
        uint256 indexed requestId,
        bytes32 indexed collegeIdHash,
        address indexed employer,
        RequestStatus status,
        address reviewer
    );

    constructor(address admin) {
        require(admin != address(0), "admin=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function requestAccess(bytes32 collegeIdHash, string calldata purpose) external returns (uint256 requestId) {
        require(collegeIdHash != bytes32(0), "collegeIdHash=0");

        _requestIdCounter++;
        requestId = _requestIdCounter;

        requests[requestId] = AccessRequest({
            requestId: requestId,
            collegeIdHash: collegeIdHash,
            employer: msg.sender,
            requestedAt: uint64(block.timestamp),
            status: RequestStatus.Pending
        });

        employerRequests[msg.sender].push(requestId);

        emit AccessRequested(requestId, collegeIdHash, msg.sender, purpose);
    }

    function approveRequest(uint256 requestId) external onlyRole(UNIVERSITY_ROLE) {
        AccessRequest storage r = requests[requestId];
        require(r.requestId != 0, "request missing");
        require(r.status == RequestStatus.Pending, "not pending");

        r.status = RequestStatus.Approved;
        accessGranted[r.collegeIdHash][r.employer] = true;

        emit AccessReviewed(requestId, r.collegeIdHash, r.employer, r.status, msg.sender);
    }

    function denyRequest(uint256 requestId) external onlyRole(UNIVERSITY_ROLE) {
        AccessRequest storage r = requests[requestId];
        require(r.requestId != 0, "request missing");
        require(r.status == RequestStatus.Pending, "not pending");

        r.status = RequestStatus.Denied;

        emit AccessReviewed(requestId, r.collegeIdHash, r.employer, r.status, msg.sender);
    }

    function revokeAccess(bytes32 collegeIdHash, address employer) external onlyRole(UNIVERSITY_ROLE) {
        require(collegeIdHash != bytes32(0), "collegeIdHash=0");
        require(employer != address(0), "employer=0");
        accessGranted[collegeIdHash][employer] = false;
        emit AccessReviewed(0, collegeIdHash, employer, RequestStatus.Revoked, msg.sender);
    }

    function getEmployerRequests(address employer) external view returns (uint256[] memory) {
        return employerRequests[employer];
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

