// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title AltriumDegreeSBT
 * @dev Soulbound ERC721 degree credentials indexed by College ID hash.
 *
 * Key design choice: the credential is *identified* by `collegeIdHash` (not by wallet),
 * but we still mint an ERC721 token to a designated "custodian" wallet (typically the
 * university admin or an institutional wallet). Transfers are permanently disabled.
 *
 * Off-chain systems (FastAPI/JWT/RBAC) should treat `collegeIdHash` as the primary key
 * and use events + view methods here for real-time verification.
 */
contract AltriumDegreeSBT is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); // e.g. `AltriumRegistry`
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE"); // e.g. university admins

    uint256 private _tokenIdCounter;

    struct DegreeRecord {
        bytes32 collegeIdHash; // student identifier (hashed off-chain)
        address issuedBy; // university admin wallet (verifier)
        uint64 issuedAt;
        bool verified;
        bytes32 degreeHash; // hash of degree payload / VC / metadata (off-chain)
        bool revoked; // true = credential revoked on-chain
        uint64 revokedAt; // timestamp of revocation (0 if not revoked)
        address revokedBy; // address that revoked the credential
    }

    mapping(uint256 => DegreeRecord) public degreeByTokenId;
    mapping(bytes32 => uint256) private _tokenIdByCollegeIdHash; // 0 => none

    event DegreeMinted(
        uint256 indexed tokenId,
        bytes32 indexed collegeIdHash,
        address indexed issuedBy,
        bytes32 degreeHash,
        string tokenURI
    );

    event DegreeVerified(uint256 indexed tokenId, bool verified, address indexed verifier);
    event DegreeRevoked(uint256 indexed tokenId, bytes32 indexed collegeIdHash, address indexed revokedBy, uint64 revokedAt);
    event CustodianUpdated(address indexed oldCustodian, address indexed newCustodian);

    constructor(address _admin) ERC721("Altrium Degree", "ALTRIUM-DEG") {
        require(_admin != address(0), "admin=0");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    }


    function tokenIdByCollegeIdHash(bytes32 collegeIdHash) external view returns (uint256) {
        return _tokenIdByCollegeIdHash[collegeIdHash];
    }

    function mintDegree(
        bytes32 collegeIdHash,
        address issuedBy,
        address recipient,
        bytes32 degreeHash,
        string memory degreeURI
    ) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        require(collegeIdHash != bytes32(0), "collegeIdHash=0");
        require(issuedBy != address(0), "issuedBy=0");
        require(_tokenIdByCollegeIdHash[collegeIdHash] == 0, "degree exists");

        _tokenIdCounter++;
        tokenId = _tokenIdCounter;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, degreeURI);

        degreeByTokenId[tokenId] = DegreeRecord({
            collegeIdHash: collegeIdHash,
            issuedBy: issuedBy,
            issuedAt: uint64(block.timestamp),
            verified: false,
            degreeHash: degreeHash,
            revoked: false,
            revokedAt: 0,
            revokedBy: address(0)
        });

        _tokenIdByCollegeIdHash[collegeIdHash] = tokenId;

        emit DegreeMinted(tokenId, collegeIdHash, issuedBy, degreeHash, degreeURI);
    }

    function setVerified(uint256 tokenId, bool verified) external onlyRole(VERIFIER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "degree missing");
        require(!degreeByTokenId[tokenId].revoked, "SBT: already revoked");
        degreeByTokenId[tokenId].verified = verified;
        emit DegreeVerified(tokenId, verified, msg.sender);
    }

    /**
     * @notice Permanently revoke a degree credential on-chain.
     * @dev Only callable by VERIFIER_ROLE (university admin). Revocation is irreversible.
     *      Emits DegreeRevoked event that is permanently readable on Etherscan.
     *      The token remains minted (not burned) so the revocation history is preserved.
     */
    function revokeDegree(uint256 tokenId) external onlyRole(VERIFIER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "degree missing");
        require(!degreeByTokenId[tokenId].revoked, "SBT: already revoked");

        degreeByTokenId[tokenId].revoked = true;
        degreeByTokenId[tokenId].revokedAt = uint64(block.timestamp);
        degreeByTokenId[tokenId].revokedBy = msg.sender;
        // Also remove the verified flag since the credential is no longer valid
        degreeByTokenId[tokenId].verified = false;

        bytes32 collegeIdHash = degreeByTokenId[tokenId].collegeIdHash;
        emit DegreeRevoked(tokenId, collegeIdHash, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Check whether a degree is revoked by collegeIdHash.
     * @return revoked true if valid tokenId exists and has been revoked.
     */
    function isRevoked(bytes32 collegeIdHash) external view returns (bool revoked) {
        uint256 tokenId = _tokenIdByCollegeIdHash[collegeIdHash];
        if (tokenId == 0) return false;
        return degreeByTokenId[tokenId].revoked;
    }

    function getDegreeByCollegeIdHash(bytes32 collegeIdHash)
        external
        view
        returns (bool exists, uint256 tokenId, DegreeRecord memory record, string memory degreeURI)
    {
        tokenId = _tokenIdByCollegeIdHash[collegeIdHash];
        if (tokenId == 0) {
            return (false, 0, record, "");
        }

        record = degreeByTokenId[tokenId];
        degreeURI = tokenURI(tokenId);
        return (true, tokenId, record, degreeURI);
    }

    /**
     * @dev Soulbound: disable transfers permanently (mint/burn still allowed).
     * OZ v5 ERC721 uses `_update` for mint/transfer/burn.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("SBT: non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Burn a degree token and clear its data to allow re-minting for the same PRN.
     * @dev Only callable by MINTER_ROLE or VERIFIER_ROLE.
     */
    function burnDegree(uint256 tokenId) external {
        require(hasRole(MINTER_ROLE, msg.sender) || hasRole(VERIFIER_ROLE, msg.sender), "SBT: unauthorized burn");
        require(_ownerOf(tokenId) != address(0), "SBT: degree missing");

        bytes32 collegeIdHash = degreeByTokenId[tokenId].collegeIdHash;
        
        // Clear mapping first
        delete _tokenIdByCollegeIdHash[collegeIdHash];
        // Clear metadata
        delete degreeByTokenId[tokenId];
        
        // Perform the burn
        _burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
