import { CodeBlock, DocPage, Sub } from "../_shared";

const Cli = () => (
  <DocPage
    kicker="CLI & Scripts"
    title="Power tools"
    summary="Backend scripts for seeding and introspection, plus the Foundry commands you'll reach for when working on contracts."
  >
    <Sub id="backend-scripts" title="Backend scripts">
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

    <Sub id="foundry" title="Foundry commands">
      <CodeBlock
        lang="bash"
        code={`forge test -vv
forge coverage
forge fmt
cast call $REGISTRY_ADDRESS "hasRole(bytes32,address)(bool)" \\
  $(cast keccak "UNIVERSITY_ROLE") $ADMIN_WALLET --rpc-url $RPC_URL`}
      />
    </Sub>

    <Sub id="docker" title="Docker helpers">
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

export default Cli;
