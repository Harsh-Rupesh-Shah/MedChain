import unittest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from starlette.requests import Request

from backend.app.config import JWT_SECRET, ADMIN_EMAIL
from backend.app.auth.security import (
    create_access_token,
    get_current_user,
    require_verified_doctor
)
from backend.app.routers.medical_records import verify_record_access
from backend.app.routers.doctors import sanitize_public_doctor
from backend.app.services.upload_validator import (
    sanitize_filename,
    validate_and_read_upload,
    ALLOWED_RECORD_EXTENSIONS,
    ALLOWED_RECORD_MIMES,
    MAX_RECORD_SIZE
)
from backend.app.main import app

def make_mock_request(headers=None, query_params=None):
    scope = {
        "type": "http",
        "headers": [(k.lower().encode("latin-1"), v.encode("latin-1")) for k, v in (headers or {}).items()],
        "query_string": "&".join(f"{k}={v}" for k, v in (query_params or {}).items()).encode("latin-1")
    }
    req = Request(scope)
    return req

class SecurityTestSuite(unittest.TestCase):

    def test_query_param_token_rejected(self):
        """Issue 11: Tokens passed in URL query parameters must be rejected."""
        token = create_access_token({"userId": "123", "role": "patient"})
        req = make_mock_request(query_params={"token": token})
        
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(get_current_user(req))
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("No token", ctx.exception.detail)

    def test_untrusted_admin_claim_rejected(self):
        """Issue 3 & 15: Forged or untrusted admin claims in JWT must be rejected."""
        fake_admin_token = create_access_token({
            "userId": "attacker",
            "role": "admin",
            "email": "attacker@evil.com"
        })
        req = make_mock_request(headers={"Authorization": f"Bearer {fake_admin_token}"})
        
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(get_current_user(req))
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("untrusted admin", ctx.exception.detail.lower())

    def test_trusted_admin_accepted(self):
        """Verified admin credentials from config/DB are accepted."""
        admin_token = create_access_token({
            "userId": "admin-123",
            "role": "admin",
            "email": ADMIN_EMAIL
        })
        req = make_mock_request(headers={"Authorization": f"Bearer {admin_token}"})
        user = asyncio.run(get_current_user(req))
        self.assertEqual(user["role"], "admin")
        self.assertEqual(user["email"], ADMIN_EMAIL)

    def test_cross_patient_record_access_forbidden(self):
        """Issue 4: Patient A cannot access Patient B's records."""
        patient_a = {"userId": "patient_a_id", "role": "patient"}
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(verify_record_access(patient_a, patient_user_id="patient_b_id", patient_profile_id="prof_b"))
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("not authorized", ctx.exception.detail.lower())

    def test_patient_can_access_own_records(self):
        """Patient can access their own records."""
        patient_a = {"userId": "patient_a_id", "role": "patient"}
        # Should not raise
        asyncio.run(verify_record_access(patient_a, patient_user_id="patient_a_id", patient_profile_id="prof_a"))

    def test_unassigned_doctor_access_forbidden(self):
        """Issue 6 & 13: An unassigned doctor cannot access an unrelated patient's records."""
        doctor_user = {"userId": "doc_unassigned_user_id", "role": "doctor"}
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(verify_record_access(doctor_user, patient_user_id="patient_x_user_id", patient_profile_id="prof_x"))
        self.assertEqual(ctx.exception.status_code, 403)

    def test_unverified_doctor_blocked(self):
        """Doctor verification requirement: Unverified doctors cannot access clinical APIs."""
        pending_doc = {
            "userId": "doc_pending_user",
            "role": "doctor",
            "isVerified": False,
            "verificationStatus": "pending"
        }
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(require_verified_doctor(pending_doc))
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("pending verification", ctx.exception.detail.lower())

    def test_path_traversal_sanitization(self):
        """Filename path traversal must be stripped cleanly."""
        self.assertEqual(sanitize_filename("../../etc/passwd"), "passwd")
        self.assertEqual(sanitize_filename("..\\..\\windows\\system32\\cmd.exe"), "cmd.exe")
        self.assertEqual(sanitize_filename("valid_lab_report.pdf"), "valid_lab_report.pdf")

    def test_invalid_upload_extension_rejected(self):
        """Issue 10: Executable or script files are strictly rejected."""
        mock_file = MagicMock()
        mock_file.filename = "trojan.exe"
        mock_file.read = AsyncMock(return_value=b"MALICIOUS")
        
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(validate_and_read_upload(
                mock_file,
                allowed_extensions=ALLOWED_RECORD_EXTENSIONS,
                allowed_mimes=ALLOWED_RECORD_MIMES,
                max_size_bytes=MAX_RECORD_SIZE,
                field_label="Medical record"
            ))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Invalid file extension", ctx.exception.detail)

    def test_oversized_upload_rejected(self):
        """Issue 10: Oversized uploads are rejected with 413."""
        mock_file = MagicMock()
        mock_file.filename = "large_scan.pdf"
        # Simulate 11 MB file
        mock_file.read = AsyncMock(return_value=b"0" * (11 * 1024 * 1024))
        
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(validate_and_read_upload(
                mock_file,
                allowed_extensions=ALLOWED_RECORD_EXTENSIONS,
                allowed_mimes=ALLOWED_RECORD_MIMES,
                max_size_bytes=MAX_RECORD_SIZE,
                field_label="Medical record"
            ))
        self.assertEqual(ctx.exception.status_code, 413)

    def test_public_doctor_listing_strips_sensitive_data(self):
        """Issue 8 & 14: Public doctor directory must never leak emails, phones, or ID credentials."""
        raw_doctor = {
            "_id": "67890",
            "name": "Dr. Sarah Jenkins",
            "specialization": "Cardiology",
            "experience": 10,
            "consultationFee": 75.0,
            "email": "sarah.jenkins@private-hospital.com",
            "phone": "+1-555-0199",
            "licenseNumber": "MED-US-99124",
            "idCardImage": "/uploads/doctor-ids/secret-id.png",
            "location": {"city": "Boston"},
            "availability": []
        }
        sanitized = sanitize_public_doctor(raw_doctor)
        self.assertNotIn("email", sanitized)
        self.assertNotIn("phone", sanitized)
        self.assertNotIn("licenseNumber", sanitized)
        self.assertNotIn("idCardImage", sanitized)
        self.assertEqual(sanitized["name"], "Dr. Sarah Jenkins")

    def test_public_static_uploads_mount_removed(self):
        """P0: Public static mounts of /uploads and /api/uploads must not exist."""
        mounted_paths = [route.path for route in app.routes if hasattr(route, "path")]
        self.assertNotIn("/uploads", mounted_paths)
        self.assertNotIn("/api/uploads", mounted_paths)

if __name__ == "__main__":
    unittest.main()
