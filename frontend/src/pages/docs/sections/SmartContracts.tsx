import { CodeBlock, DocPage, Sub } from "../_shared";
import { useDocsContent } from "../content";

const SmartContracts = () => {
  const page = useDocsContent().pages.smartContracts;

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      <Sub id="registry" title={page.sections.registry.title}>
        <p>{page.sections.registry.body}</p>
        <CodeBlock
          lang="solidity"
          code={`function addUniversity(address universityAdmin) external;
function removeUniversity(address universityAdmin) external;
function hasRole(bytes32 role, address account) external view returns (bool);

bytes32 public constant UNIVERSITY_ROLE = keccak256("UNIVERSITY_ROLE");`}
        />
      </Sub>

      <Sub id="sbt" title={page.sections.sbt.title}>
        <p>{page.sections.sbt.body}</p>
        <CodeBlock
          lang="solidity"
          code={`function mintDegree(address to, string calldata metadataURI)
    external
    onlyRole(UNIVERSITY_ROLE)
    returns (uint256 tokenId);

function revoke(uint256 tokenId) external onlyRole(UNIVERSITY_ROLE);

// All transfer hooks revert - SBTs cannot move
function _update(address to, uint256 tokenId, address auth)
    internal override returns (address);`}
        />
      </Sub>

      <Sub id="deployment" title={page.sections.deployment.title}>
        <CodeBlock
          lang="bash"
          code={`cd contracts
forge build
forge script script/DeployRegistry.s.sol --rpc-url $RPC_URL --broadcast
forge script script/DeploySBT.s.sol      --rpc-url $RPC_URL --broadcast

# Copy the two printed addresses into backend/.env and frontend/.env.`}
        />
        <p>{page.sections.deployment.body}</p>
      </Sub>

      <Sub id="events" title={page.sections.events.title}>
        <p>{page.sections.events.body}</p>
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
};

export default SmartContracts;
