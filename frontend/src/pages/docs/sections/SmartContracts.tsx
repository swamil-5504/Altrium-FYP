import { CodeBlock, DocPage, K, Sub } from "../_shared";

const SmartContracts = () => (
  <DocPage
    kicker="Smart Contracts"
    title="Solidity on Sepolia"
    summary="Two contracts run the on-chain half of Altrium: the Registry controls which wallets may issue credentials, and the Degree SBT mints and revokes them."
  >
    <Sub id="registry" title="AltriumRegistry">
      <p>
        OpenZeppelin <K>AccessControl</K> wrapper that owns the canonical
        list of approved universities. The deployer holds{" "}
        <K>DEFAULT_ADMIN_ROLE</K>; verified admin wallets hold{" "}
        <K>UNIVERSITY_ROLE</K>.
      </p>
      <CodeBlock
        lang="solidity"
        code={`function addUniversity(address universityAdmin) external;
function removeUniversity(address universityAdmin) external;
function hasRole(bytes32 role, address account) external view returns (bool);

bytes32 public constant UNIVERSITY_ROLE = keccak256("UNIVERSITY_ROLE");`}
      />
    </Sub>

    <Sub id="sbt" title="AltriumDegreeSBT">
      <p>
        ERC-721 with every transfer path reverted — a true Soulbound Token.
        Only addresses that hold <K>UNIVERSITY_ROLE</K> on the Registry can
        mint.
      </p>
      <CodeBlock
        lang="solidity"
        code={`function mintDegree(address to, string calldata metadataURI)
    external
    onlyRole(UNIVERSITY_ROLE)
    returns (uint256 tokenId);

function revoke(uint256 tokenId) external onlyRole(UNIVERSITY_ROLE);

// All transfer hooks revert — SBTs cannot move
function _update(address to, uint256 tokenId, address auth)
    internal override returns (address);`}
      />
    </Sub>

    <Sub id="deployment" title="Deployment">
      <CodeBlock
        lang="bash"
        code={`cd contracts
forge build
forge script script/DeployRegistry.s.sol --rpc-url $RPC_URL --broadcast
forge script script/DeploySBT.s.sol      --rpc-url $RPC_URL --broadcast

# Copy the two printed addresses into backend/.env and frontend/.env.`}
      />
      <p>
        After deployment, the deployer wallet must call{" "}
        <K>addUniversity(adminWallet)</K> for each approved admin. The
        backend automates this whenever Super Admin clicks <em>Approve</em> on
        an admin who already has a wallet on file.
      </p>
    </Sub>

    <Sub id="events" title="Events">
      <p>Both contracts emit events that can be indexed for analytics or webhooks:</p>
      <CodeBlock
        lang="solidity"
        code={`event DegreeMinted(uint256 indexed tokenId, address indexed student, string metadataURI);
event DegreeRevoked(uint256 indexed tokenId, address indexed issuer);
event UniversityAdded(address indexed universityAdmin);
event UniversityRemoved(address indexed universityAdmin);`}
      />
    </Sub>
  </DocPage>
);

export default SmartContracts;
