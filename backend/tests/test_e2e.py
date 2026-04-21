"""
End-to-end tests for Altrium Degree Verification System v1.0.0
Covers: health checks, auth flows, RBAC, degree workflow, public endpoints.

Run with:  pytest -v
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient


# ═══════════════════════════════════════════════════════════════════════════════
# 1. HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════════════════════

class TestHealthChecks:
    async def test_root_returns_api_info(self, client: AsyncClient):
        r = await client.get("/")
        assert r.status_code == 200
        body = r.json()
        assert "Altrium" in body["message"]
        assert body["version"] == "1.0.0"

    async def test_ping_returns_pong(self, client: AsyncClient):
        r = await client.get("/ping")
        assert r.status_code == 200
        assert r.json() == {"message": "pong", "status": "ok"}

    async def test_health_shows_active_mongodb(self, client: AsyncClient):
        r = await client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "healthy"
        assert body["connection"] == "active"
        assert "users_count" in body

    async def test_openapi_schema_accessible(self, client: AsyncClient):
        r = await client.get("/api/v1/openapi.json")
        assert r.status_code == 200
        schema = r.json()
        assert schema["info"]["title"] == "Altrium - Degree Verification System"


# ═══════════════════════════════════════════════════════════════════════════════
# 2. AUTHENTICATION
# ═══════════════════════════════════════════════════════════════════════════════

class TestAuthentication:
    async def test_superadmin_seeded_at_startup(self, client: AsyncClient):
        """App lifespan must seed the superadmin on first boot."""
        r = await client.post(
            "/api/v1/auth/login",
            json={"email": "sa@altrium.test", "password": "SuperAdmin123!"},
        )
        assert r.status_code == 200, "Superadmin seed failed at startup"
        body = r.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    async def test_register_student_succeeds(self, client: AsyncClient, registered_student: dict):
        assert registered_student["email"] == "student@altrium.test"
        assert registered_student["role"] == "STUDENT"
        assert "id" in registered_student
        assert "hashed_password" not in registered_student

    async def test_register_admin_succeeds(self, client: AsyncClient, registered_admin: dict):
        assert registered_admin["email"] == "admin@altrium.test"
        assert registered_admin["role"] == "ADMIN"
        assert registered_admin["college_name"] == "Altrium University"

    async def test_duplicate_email_rejected(self, client: AsyncClient, registered_student: dict):
        r = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "student@altrium.test",
                "password": "Other123!",
                "role": "STUDENT",
            },
        )
        assert r.status_code == 400
        assert "already registered" in r.json()["detail"]

    async def test_login_returns_token_pair(self, client: AsyncClient, registered_student: dict):
        r = await client.post(
            "/api/v1/auth/login",
            json={"email": "student@altrium.test", "password": "Student123!"},
        )
        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["expires_in"] > 0
        assert body["refresh_expires_in"] > 0

    async def test_login_wrong_password_rejected(self, client: AsyncClient, registered_student: dict):
        r = await client.post(
            "/api/v1/auth/login",
            json={"email": "student@altrium.test", "password": "WrongPass!"},
        )
        assert r.status_code == 401
        assert "Invalid credentials" in r.json()["detail"]

    async def test_login_unknown_email_rejected(self, client: AsyncClient):
        r = await client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@nowhere.com", "password": "anything"},
        )
        assert r.status_code == 401

    async def test_token_refresh_issues_new_pair(self, client: AsyncClient, registered_student: dict):
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "student@altrium.test", "password": "Student123!"},
        )
        refresh_token = login.json()["refresh_token"]

        r = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body
        assert "refresh_token" in body

    async def test_invalid_refresh_token_rejected(self, client: AsyncClient):
        r = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "totally.invalid.jwt"},
        )
        assert r.status_code == 401

    async def test_logout_always_succeeds(self, client: AsyncClient):
        r = await client.post("/api/v1/auth/logout")
        assert r.status_code == 200
        assert "Logged out" in r.json()["detail"]

    async def test_protected_route_without_token_returns_403(self, client: AsyncClient):
        """HTTPBearer raises 403 when the Authorization header is absent."""
        r = await client.get("/api/v1/users/me")
        assert r.status_code == 403

    async def test_protected_route_with_bad_token_returns_401(self, client: AsyncClient):
        r = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer bad.token.value"},
        )
        assert r.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# 3. USER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

class TestUserManagement:
    async def test_universities_list_is_public(self, client: AsyncClient):
        r = await client.get("/api/v1/users/universities")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    async def test_get_me_as_student(self, client: AsyncClient, student_token: str):
        r = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == "student@altrium.test"
        assert body["role"] == "STUDENT"
        assert body["prn_number"] == "AU2024001"
        assert body["college_name"] == "Altrium University"

    async def test_get_me_as_admin(self, client: AsyncClient, admin_token: str):
        r = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["role"] == "ADMIN"
        assert body["college_name"] == "Altrium University"

    async def test_get_me_as_superadmin(self, client: AsyncClient, superadmin_token: str):
        r = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {superadmin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["role"] == "SUPERADMIN"

    async def test_superadmin_lists_all_users(self, client: AsyncClient, superadmin_token: str, registered_student: dict, registered_admin: dict):
        r = await client.get(
            "/api/v1/users/",
            headers={"Authorization": f"Bearer {superadmin_token}"},
        )
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list)
        emails = [u["email"] for u in users]
        assert "sa@altrium.test" in emails
        assert "admin@altrium.test" in emails
        assert "student@altrium.test" in emails

    async def test_admin_can_list_all_users(self, client: AsyncClient, admin_token: str):
        r = await client.get(
            "/api/v1/users/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200

    async def test_student_cannot_list_users(self, client: AsyncClient, student_token: str):
        r = await client.get(
            "/api/v1/users/",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    async def test_superadmin_verifies_admin(
        self, client: AsyncClient, superadmin_token: str, registered_admin: dict
    ):
        admin_id = registered_admin["id"]
        r = await client.post(
            f"/api/v1/users/verify-admin/{admin_id}",
            headers={"Authorization": f"Bearer {superadmin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["is_legal_admin_verified"] is True

    async def test_verify_admin_idempotent(
        self, client: AsyncClient, superadmin_token: str, registered_admin: dict
    ):
        """Calling verify-admin on an already-verified admin must succeed."""
        admin_id = registered_admin["id"]
        r = await client.post(
            f"/api/v1/users/verify-admin/{admin_id}",
            headers={"Authorization": f"Bearer {superadmin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["is_legal_admin_verified"] is True

    async def test_student_cannot_verify_admin(
        self, client: AsyncClient, student_token: str, registered_admin: dict
    ):
        r = await client.post(
            f"/api/v1/users/verify-admin/{registered_admin['id']}",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    async def test_verify_nonexistent_user_returns_404(
        self, client: AsyncClient, superadmin_token: str
    ):
        fake_id = "00000000-0000-0000-0000-000000000000"
        r = await client.post(
            f"/api/v1/users/verify-admin/{fake_id}",
            headers={"Authorization": f"Bearer {superadmin_token}"},
        )
        assert r.status_code == 404

    async def test_admin_updates_wallet_address(
        self, client: AsyncClient, admin_token: str
    ):
        r = await client.patch(
            "/api/v1/users/me/wallet",
            json={"wallet_address": "0x1234567890abcdef1234567890abcdef12345678"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["wallet_address"] == "0x1234567890abcdef1234567890abcdef12345678"

    async def test_wallet_update_rejects_empty_address(
        self, client: AsyncClient, admin_token: str
    ):
        r = await client.patch(
            "/api/v1/users/me/wallet",
            json={"wallet_address": ""},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 400

    async def test_student_cannot_update_wallet(
        self, client: AsyncClient, student_token: str
    ):
        r = await client.patch(
            "/api/v1/users/me/wallet",
            json={"wallet_address": "0xabc"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    async def test_admin_gets_students_in_same_college(
        self, client: AsyncClient, admin_token: str, registered_student: dict
    ):
        r = await client.get(
            "/api/v1/users/my-students",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        students = r.json()
        assert isinstance(students, list)
        prns = [s["prn_number"] for s in students]
        assert "AU2024001" in prns

    async def test_student_cannot_get_my_students(
        self, client: AsyncClient, student_token: str
    ):
        r = await client.get(
            "/api/v1/users/my-students",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 4. DEGREE WORKFLOW  (PENDING → APPROVED → REVOKED → RESET → DELETE)
# ═══════════════════════════════════════════════════════════════════════════════

@pytest_asyncio.fixture(scope="module")
async def degree(client: AsyncClient, student_token: str) -> dict:
    """Create a single credential used for the happy-path workflow tests."""
    r = await client.post(
        "/api/v1/degrees/",
        json={"title": "Bachelor of Technology", "description": "Computer Science"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r.status_code == 200, f"Degree creation failed: {r.text}"
    return r.json()


class TestDegreeWorkflow:
    async def test_student_submits_degree(self, degree: dict):
        assert degree["title"] == "Bachelor of Technology"
        assert degree["status"] == "PENDING"
        assert degree["college_name"] == "Altrium University"
        assert degree["prn_number"] == "AU2024001"
        assert "id" in degree
        assert "document_uid" in degree

    async def test_admin_cannot_submit_degree(self, client: AsyncClient, admin_token: str):
        r = await client.post(
            "/api/v1/degrees/",
            json={"title": "Should Fail"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 403

    async def test_student_sees_own_degree_in_list(
        self, client: AsyncClient, student_token: str, degree: dict
    ):
        r = await client.get(
            "/api/v1/degrees/",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 200
        ids = [d["id"] for d in r.json()]
        assert degree["id"] in ids

    async def test_admin_sees_pending_degree_for_college(
        self, client: AsyncClient, admin_token: str, degree: dict
    ):
        r = await client.get(
            "/api/v1/degrees/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        ids = [d["id"] for d in r.json()]
        assert degree["id"] in ids

    async def test_student_gets_degree_by_id(
        self, client: AsyncClient, student_token: str, degree: dict
    ):
        r = await client.get(
            f"/api/v1/degrees/{degree['id']}",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 200
        assert r.json()["id"] == degree["id"]

    async def test_unauthenticated_cannot_get_degree_by_id(
        self, client: AsyncClient, degree: dict
    ):
        r = await client.get(f"/api/v1/degrees/{degree['id']}")
        assert r.status_code == 403

    async def test_nonexistent_degree_returns_404(
        self, client: AsyncClient, student_token: str
    ):
        fake = "00000000-0000-0000-0000-000000000000"
        r = await client.get(
            f"/api/v1/degrees/{fake}",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 404

    async def test_admin_updates_degree_description(
        self, client: AsyncClient, admin_token: str, degree: dict
    ):
        r = await client.patch(
            f"/api/v1/degrees/{degree['id']}",
            json={"description": "Computer Science and Engineering"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["description"] == "Computer Science and Engineering"

    async def test_student_cannot_update_degree(
        self, client: AsyncClient, student_token: str, degree: dict
    ):
        r = await client.patch(
            f"/api/v1/degrees/{degree['id']}",
            json={"description": "Hacked"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    async def test_student_cannot_change_degree_status(
        self, client: AsyncClient, student_token: str, degree: dict
    ):
        r = await client.patch(
            f"/api/v1/degrees/{degree['id']}/status",
            params={"status": "APPROVED"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    async def test_admin_approves_degree(
        self, client: AsyncClient, admin_token: str, degree: dict
    ):
        r = await client.patch(
            f"/api/v1/degrees/{degree['id']}/status",
            params={"status": "APPROVED"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "APPROVED"

    async def test_approved_degree_appears_in_public_list(
        self, client: AsyncClient, degree: dict
    ):
        r = await client.get("/api/v1/degrees/public")
        assert r.status_code == 200
        ids = [d["id"] for d in r.json()]
        assert degree["id"] in ids

    async def test_public_list_by_prn(self, client: AsyncClient, degree: dict):
        r = await client.get(
            "/api/v1/degrees/public",
            params={"prn_number": "AU2024001"},
        )
        assert r.status_code == 200
        results = r.json()
        assert len(results) >= 1
        assert all(d["prn_number"] == "AU2024001" for d in results)
        assert all(d["status"] == "APPROVED" for d in results)

    async def test_admin_revokes_approved_degree(
        self, client: AsyncClient, admin_token: str, degree: dict
    ):
        r = await client.patch(
            f"/api/v1/degrees/{degree['id']}/revoke",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["revoked"] is True
        assert body["revoked_at"] is not None

    async def test_admin_resets_degree_after_burn(
        self, client: AsyncClient, admin_token: str, degree: dict
    ):
        r = await client.post(
            f"/api/v1/degrees/{degree['id']}/reset",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "PENDING"
        assert body["revoked"] is False
        assert body["token_id"] is None
        assert body["tx_hash"] is None


# ═══════════════════════════════════════════════════════════════════════════════
# 5. REJECTION FLOW
# ═══════════════════════════════════════════════════════════════════════════════

@pytest_asyncio.fixture(scope="module")
async def rejected_degree(client: AsyncClient, student_token: str, admin_token: str) -> dict:
    create = await client.post(
        "/api/v1/degrees/",
        json={"title": "Master of Science", "description": "Data Science"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert create.status_code == 200
    cred_id = create.json()["id"]

    reject = await client.patch(
        f"/api/v1/degrees/{cred_id}/status",
        params={"status": "REJECTED"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reject.status_code == 200
    return reject.json()


class TestRejectionFlow:
    async def test_rejected_status_persisted(self, rejected_degree: dict):
        assert rejected_degree["status"] == "REJECTED"

    async def test_rejected_degree_not_in_public_list(
        self, client: AsyncClient, rejected_degree: dict
    ):
        r = await client.get("/api/v1/degrees/public")
        assert r.status_code == 200
        ids = [d["id"] for d in r.json()]
        assert rejected_degree["id"] not in ids

    async def test_admin_can_delete_rejected_degree(
        self, client: AsyncClient, admin_token: str, rejected_degree: dict
    ):
        r = await client.delete(
            f"/api/v1/degrees/{rejected_degree['id']}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        assert "deleted" in r.json()["detail"].lower()

    async def test_deleted_degree_returns_404(
        self, client: AsyncClient, student_token: str, rejected_degree: dict
    ):
        r = await client.get(
            f"/api/v1/degrees/{rejected_degree['id']}",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# 6. DOCUMENT UPLOAD
# ═══════════════════════════════════════════════════════════════════════════════

@pytest_asyncio.fixture(scope="module")
async def degree_for_upload(client: AsyncClient, student_token: str) -> dict:
    r = await client.post(
        "/api/v1/degrees/",
        json={"title": "Diploma in Engineering"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r.status_code == 200
    return r.json()


class TestDocumentUpload:
    async def test_student_uploads_pdf_document(
        self, client: AsyncClient, student_token: str, degree_for_upload: dict, tmp_path
    ):
        # Create a minimal valid PDF in memory
        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n9\n%%EOF"
        r = await client.post(
            f"/api/v1/degrees/{degree_for_upload['id']}/document",
            files={"file": ("degree.pdf", pdf_content, "application/pdf")},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 200
        assert r.json()["has_document"] is True

    async def test_non_pdf_upload_rejected(
        self, client: AsyncClient, student_token: str, degree_for_upload: dict
    ):
        r = await client.post(
            f"/api/v1/degrees/{degree_for_upload['id']}/document",
            files={"file": ("not_a_pdf.txt", b"hello world", "text/plain")},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 400
        assert "PDF" in r.json()["detail"]

    async def test_download_pending_document_returns_pdf(
        self, client: AsyncClient, student_token: str, degree_for_upload: dict
    ):
        """Pending docs served without blockchain footer."""
        r = await client.get(
            f"/api/v1/degrees/{degree_for_upload['id']}/document",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        # Pending status means footer is skipped → FileResponse with the original PDF
        assert r.status_code == 200
        assert "pdf" in r.headers.get("content-type", "")

    async def test_unauthorized_user_cannot_download_document(
        self, client: AsyncClient, degree_for_upload: dict
    ):
        r = await client.get(f"/api/v1/degrees/{degree_for_upload['id']}/document")
        assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 7. SUPERADMIN OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest_asyncio.fixture(scope="module")
async def user_to_delete(client: AsyncClient) -> dict:
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "ephemeral@altrium.test",
            "password": "Ephemeral123!",
            "full_name": "Ephemeral User",
            "role": "STUDENT",
        },
    )
    assert r.status_code == 200
    return r.json()


class TestSuperadminOperations:
    async def test_superadmin_deletes_user(
        self, client: AsyncClient, superadmin_token: str, user_to_delete: dict
    ):
        r = await client.delete(
            f"/api/v1/users/{user_to_delete['id']}",
            headers={"Authorization": f"Bearer {superadmin_token}"},
        )
        assert r.status_code == 204

    async def test_deleted_user_cannot_log_in(
        self, client: AsyncClient, user_to_delete: dict
    ):
        r = await client.post(
            "/api/v1/auth/login",
            json={"email": "ephemeral@altrium.test", "password": "Ephemeral123!"},
        )
        assert r.status_code == 401

    async def test_admin_cannot_delete_user(
        self, client: AsyncClient, admin_token: str, registered_student: dict
    ):
        r = await client.delete(
            f"/api/v1/users/{registered_student['id']}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 403

    async def test_delete_nonexistent_user_returns_404(
        self, client: AsyncClient, superadmin_token: str
    ):
        fake_id = "00000000-0000-0000-0000-000000000000"
        r = await client.delete(
            f"/api/v1/users/{fake_id}",
            headers={"Authorization": f"Bearer {superadmin_token}"},
        )
        assert r.status_code == 404

    async def test_superadmin_sees_all_credentials(
        self, client: AsyncClient, superadmin_token: str, degree: dict
    ):
        r = await client.get(
            "/api/v1/degrees/",
            headers={"Authorization": f"Bearer {superadmin_token}"},
        )
        assert r.status_code == 200
        ids = [d["id"] for d in r.json()]
        assert degree["id"] in ids


# ═══════════════════════════════════════════════════════════════════════════════
# 8. VERIFICATION DOCUMENT UPLOAD (admin onboarding)
# ═══════════════════════════════════════════════════════════════════════════════

class TestAdminVerificationDocument:
    async def test_upload_verification_doc_for_admin(
        self, client: AsyncClient, registered_admin: dict
    ):
        admin_id = registered_admin["id"]
        pdf = b"%PDF-1.4\n%%EOF"
        r = await client.post(
            f"/api/v1/auth/{admin_id}/verification-document",
            files={"file": ("verification.pdf", pdf, "application/pdf")},
        )
        assert r.status_code == 200
        assert "success" in r.json()["detail"].lower()

    async def test_upload_verification_doc_for_nonexistent_user(
        self, client: AsyncClient
    ):
        fake_id = "00000000-0000-0000-0000-000000000000"
        pdf = b"%PDF-1.4\n%%EOF"
        r = await client.post(
            f"/api/v1/auth/{fake_id}/verification-document",
            files={"file": ("verification.pdf", pdf, "application/pdf")},
        )
        assert r.status_code == 404
