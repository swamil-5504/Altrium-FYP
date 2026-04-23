import { CodeBlock, DocPage, Sub, Ol, Ul, K } from "../_shared";

const Quickstart = () => (
  <DocPage
    kicker="Quickstart"
    title="Run Altrium in 15 minutes"
    summary="This guide stands up the full stack on your machine — MongoDB, the FastAPI backend, the Vite dev server, and the Sepolia-connected frontend — all behind one Docker Compose file."
  >
    <Sub id="prerequisites" title="Prerequisites">
      <Ul>
        <li>Docker & Docker Compose (recommended), or</li>
        <li>Node.js 18+, Python 3.11+, npm, MongoDB 6+</li>
        <li>A MetaMask wallet funded with Sepolia ETH</li>
        <li>An Infura / Alchemy Sepolia RPC URL</li>
      </Ul>
    </Sub>

    <Sub id="install-docker" title="Install with Docker">
      <CodeBlock
        lang="bash"
        code={`git clone https://github.com/swamil-5504/Altrium-FYP.git
cd Altrium-FYP

# populate backend/.env and frontend/.env (see "Environment variables")

docker compose up --build

# App:       http://localhost:5173
# API docs:  http://localhost:8000/docs`}
      />
      <p>
        Compose spins up MongoDB, the FastAPI backend, and the Vite dev server
        in a single command. Logs stream to your terminal; <K>Ctrl+C</K>{" "}
        gracefully stops all three.
      </p>
    </Sub>

    <Sub id="install-manual" title="Manual install">
      <CodeBlock
        lang="bash"
        code={`# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 2. Frontend (in a new shell)
cd frontend
npm install
npm run dev

# 3. Smart contracts (optional — pre-deployed on Sepolia)
cd contracts
forge build
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast`}
      />
    </Sub>

    <Sub id="environment" title="Environment variables">
      <p>
        Create <K>backend/.env</K>:
      </p>
      <CodeBlock
        lang="env"
        code={`SECRET_KEY=change_me_to_a_long_random_string
DATABASE_URL=mongodb://mongo:27017/altrium
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

WEB3_PROVIDER_URI=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
CONTRACT_SBT_ADDRESS=0x...
CONTRACT_REGISTRY_ADDRESS=0x...
REGISTRY_ADDRESS=0x...
PRIVATE_KEY=0x...   # deployer wallet; used to grant UNIVERSITY_ROLE

ALLOW_SELF_SERVE_PASSWORD_RESET=false  # must be false in production`}
      />
      <p>
        Create <K>frontend/.env</K>:
      </p>
      <CodeBlock
        lang="env"
        code={`VITE_API_BASE_URL=http://localhost:8000
VITE_CONTRACT_SBT_ADDRESS=0x...
VITE_CONTRACT_REGISTRY_ADDRESS=0x...
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_WEB3_PROVIDER_URI=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_REGISTRY_ADDRESS=0x...
VITE_REOWN_PROJECT_ID=your_reown_projectid`}
      />
    </Sub>

    <Sub id="first-run" title="First run checklist">
      <Ol>
        <li>Visit <K>http://localhost:5173</K> — the landing page loads.</li>
        <li>Register as a Super Admin (first registered superadmin is auto-approved).</li>
        <li>Register a University Admin account and upload a verification PDF.</li>
        <li>Log in as Super Admin and approve the admin.</li>
        <li>As the admin, connect MetaMask on Sepolia — triggers the on-chain <K>addUniversity</K> call.</li>
        <li>Register as a Student, submit a degree, let the admin mint it.</li>
        <li>From any browser, visit <K>/verify</K> and look up by PRN.</li>
      </Ol>
    </Sub>
  </DocPage>
);

export default Quickstart;
