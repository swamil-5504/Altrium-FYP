import { CodeBlock, DocPage, Sub } from "../_shared";
import { useDocsContent } from "../content";

const Cli = () => {
  const page = useDocsContent().pages.cli;

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      <Sub id="backend-scripts" title={page.sections.backendScripts.title}>
        <CodeBlock
          lang="bash"
          code={`# Seed the DB from the sample Excel roster
python scripts/seed_from_excel.py ../sample_btech_students.xlsx

# Inspect raw documents
python inspect_db.py

# Run the full pytest suite
pytest -q`}
        />
      </Sub>

      <Sub id="foundry" title={page.sections.foundryCommands.title}>
        <CodeBlock
          lang="bash"
          code={`forge test -vv
forge coverage
forge fmt
cast call $REGISTRY_ADDRESS "hasRole(bytes32,address)(bool)" \\
  $(cast keccak "UNIVERSITY_ROLE") $ADMIN_WALLET --rpc-url $RPC_URL`}
        />
      </Sub>

      <Sub id="docker" title={page.sections.dockerHelpers.title}>
        <CodeBlock
          lang="bash"
          code={`# rebuild & restart after teammates push code
docker compose up --build -d

# tail backend logs
docker compose logs -f backend

# open a mongo shell against the container
docker compose exec mongo mongosh altrium`}
        />
      </Sub>
    </DocPage>
  );
};

export default Cli;
