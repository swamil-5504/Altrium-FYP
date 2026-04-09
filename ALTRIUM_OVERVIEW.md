# Altrium: Next-Gen Academic Credentialing on Ethereum 🎓

## 📜 Executive Summary
Altrium is a production-hardened platform for issuing, managing, and verifying academic degrees as **Soulbound Tokens (SBTs)**. By combining the immutable transparency of the Ethereum blockchain with a user-friendly custodial architecture, Altrium solves the problem of degree forgery while eliminating the technical friction usually associated with Web3.

---

## 🏗️ The 3 Pillars of Altrium

### 1. **Frictionless Custody (Institutional Trust)**
Unlike traditional crypto projects that require students to manage "Private Keys" and "Gas Fees," Altrium operates on a **Custodial Model**. 
*   **The Problem:** In standard systems, if a student loses their password, their degree is lost forever.
*   **The Altrium Solution:** The University acts as the root of trust. The university admin mints the degree, and the student simply verifies it via their PRN (ID). This makes the platform accessible to 100% of students, not just tech experts.

### 2. **Dynamic On-Chain Identity (SVG Engine)**
Altrium handles visuals fundamentally differently than other platforms.
*   **The Problem:** Most NFTs link to an external image URL. If that website goes down, the NFT becomes a dead link.
*   **The Altrium Solution:** Every Altrium certificate is **mathematically generated on-chain**. The SVG code (the "DNA" of the image) is constructed inside the smart contract based on the student's CGPA and Title. Your degree's appearance is a permanent part of the blockchain's history.

### 3. **The "Soulbound" Standard (SBT)**
*   **The Problem:** Degrees shouldn't be tradable or sellable assets.
*   **The Altrium Solution:** We use the **SBT protocol**. Transfers are permanently disabled at the smart contract level. These are "Bound to the Soul" of the student's identity and can never be moved, sold, or stolen.

---

## 🛠️ Key High-Fidelity Features

### 🔹 Tiered Reputation System
Altrium doesn't just store data; it interprets performance. Our system automatically maps student CGPA to visual "Tiers":
*   **Gold/Distinction (9.0+):** Premium gold-themed badge.
*   **Emerald/Honors (8.0+):** High-achievement green badge.
*   **Merit/Pass:** Standard professional blue badge.
*   *Why?* It provides instant "Social Proof" for employers at a single glance.

### 🔹 Triple-Layer Verification
We don't ask you to "trust us." We prove it in three ways:
1.  **Public Directory:** A fast, searchable database for quick background checks.
2.  **On-Chain Link:** A direct link to **Sepolia Etherscan**, showing the exact timestamp and transaction proof.
3.  **Client-Side Integrity Check:** A unique feature where the browser re-hashes the student's metadata and compares it to the on-chain hash. If a single pixel of student data was changed, the check turns **RED**.

### 🔹 "Hard" Revocation Logic
Most digital degrees are "forever valid" even if they were issued in error.
*   Altrium implements **On-Chain Revocation**. When a university revokes a degree, a "Revoked" flag is permanently written to the smart contract. Even years later, an employer checking that token on Etherscan will see the revocation status.

### 🔹 Bulk Administrative Tools
University admins can import entire student classes via **CSV files**. The system parses the data, calculates the tiers, and queues the minting process for hundreds of students in seconds.

### 🔹 Professional Print View
Every verified degree comes with a **Print-Ready Stylesheet**. Clicking "Print" removes all the "Web UI" (buttons, navbars) and leaves a perfectly formatted, professional certificate ready for physical filing or framing.

---

## 🥊 Altrium vs. The "Competition" (IEEE Research Prototypes)

| Feature | Research Paper Prototypes | **Altrium (Final Version)** |
| :--- | :--- | :--- |
| **Status** | Conceptual / Theory | **Production Ready / Full-Stack** |
| **Visuals** | None (Raw data only) | **Dynamic, Tiered On-Chain SVG** |
| **UX** | Requires student-side wallet | **Institutional Custody (Zero Student Friction)** |
| **Transfer** | Usually transferable | **Soulbound (Non-transferable)** |
| **Verification**| Hard manual comparison | **Automated 1-Click Integrity Button** |
| **MetaMask** | No integration | **Native NFT Tab Support (Image + Metadata)** |

---

## 💻 Technical Stack
*   **Blockchain:** Solidity (Ethereum / Sepolia), Foundry (Contract testing).
*   **Backend:** FastAPI (Python), MongoDB (ACID compliant storage).
*   **Frontend:** React, TypeScript, Tailwind CSS, Ethers.js v6.
*   **Deployment:** Docker Compose (Orchestrated production stack).

---

## 🧭 Future Roadmap: The "Gold Standard"
The Altrium vision includes moving towards:
*   **Zero-Knowledge Proofs (ZKP):** Verify a student has a CGPA > 8.0 without revealing the exact decimal.
*   **DID (Decentralized Identity):** Integrating with W3C standards for cross-border academic recognition.
*   **IPFS Redundancy:** Moving the "Snapshot" of the PDF degree to InterPlanetary File System for 100% server-less document storage.

---

**Altrium: Academic Integrity, Anchored on the Blockchain.**
