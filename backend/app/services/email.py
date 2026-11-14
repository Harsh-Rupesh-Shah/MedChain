import random
import string
import smtplib
import logging
import base64
import json
import urllib
import urllib.request
import urllib.parse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.app.config import (
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM,
    GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, SENDER_EMAIL
)

logger = logging.getLogger("medchain.email")

def generate_google_meet_link(doctor: dict | None = None) -> str:
    """Generate or retrieve a valid, usable Google Meet link for consultations."""
    # 1. Doctor's dedicated consultation link if configured
    if doctor and doctor.get("meetLink") and doctor["meetLink"].strip():
        return doctor["meetLink"].strip()

    # 2. Configured permanent or instant Google Meet link from environment
    from backend.app.config import GOOGLE_MEET_LINK
    if GOOGLE_MEET_LINK and GOOGLE_MEET_LINK.strip():
        return GOOGLE_MEET_LINK.strip()

    return "https://meet.google.com/new"

def get_gmail_access_token() -> str | None:
    """Exchange OAuth2 refresh token for short-lived access token using Google APIs."""
    if not (GMAIL_REFRESH_TOKEN and GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET):
        return None

    token_url = "https://oauth2.googleapis.com/token"
    payload = urllib.parse.urlencode({
        "client_id": GMAIL_CLIENT_ID,
        "client_secret": GMAIL_CLIENT_SECRET,
        "refresh_token": GMAIL_REFRESH_TOKEN,
        "grant_type": "refresh_token"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(token_url, data=payload, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("access_token")
            logger.warning(f"Google OAuth token exchange returned status {resp.status}")
    except Exception as e:
        logger.warning(f"Google OAuth token exchange failed: {e}")
    return None

def send_via_gmail_api(to_email: str, subject: str, content: str, access_token: str) -> bool:
    """Send email directly through Gmail REST API (users.messages.send)."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SENDER_EMAIL or SMTP_FROM or "me"
        msg["To"] = to_email

        part_text = MIMEText(content, "plain")
        part_html = MIMEText(content.replace("\n", "<br>"), "html")
        msg.attach(part_text)
        msg.attach(part_html)

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
        api_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        body = json.dumps({"raw": raw}).encode("utf-8")

        req = urllib.request.Request(api_url, data=body, method="POST")
        req.add_header("Authorization", f"Bearer {access_token}")
        req.add_header("Content-Type", "application/json")

        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status in (200, 201):
                logger.info(f"Email dispatched successfully to {to_email} via Gmail REST API.")
                return True
            logger.warning(f"Gmail API returned status {resp.status}")
    except Exception as e:
        logger.warning(f"Gmail REST API send failed: {e}")
    return False

async def send_appointment_email(
    to_email: str,
    subject: str,
    appointment_details: dict,
    is_doctor: bool = False
) -> str | None:
    """Send appointment confirmation email to doctor or patient and return Google Meet link."""
    doctor_name = appointment_details.get("doctorName", "Doctor")
    patient_name = appointment_details.get("patientName", "Patient")
    date_str = appointment_details.get("date", "")
    time_slot = appointment_details.get("timeSlot", {})
    start_time = time_slot.get("startTime", "")
    end_time = time_slot.get("endTime", "")
    apt_type = appointment_details.get("type", "in-person")
    meet_link = appointment_details.get("meetLink") or (generate_google_meet_link() if apt_type == "video" else None)

    salutation = f"Dr. {doctor_name}" if is_doctor else patient_name
    header_text = (
        f"A new clinical consultation has been booked with patient {patient_name}."
        if is_doctor else
        f"Your consultation has been confirmed with Dr. {doctor_name}."
    )

    call_details = f"""
    Telemedicine Video Call:
    Direct Consultation Link: {meet_link}
    (Please join 5 minutes before scheduled start time)
    """ if meet_link else """
    Consultation Location: MedChain Clinical Center
    Please arrive 10 minutes prior to your scheduled time.
    """

    content = f"""
    Dear {salutation},

    {header_text}

    Appointment Details:
    - Date: {date_str}
    - Time Slot: {start_time} - {end_time}
    - Format: {apt_type.capitalize()} Consultation
    {call_details}

    If you need to reschedule or communicate regarding this consultation, please visit your MedChain portal.

    Warm regards,
    MedChain Healthcare Network
    """

    # 1. Attempt sending via Gmail OAuth API first (most reliable, avoids SMTP port restrictions)
    access_token = get_gmail_access_token()
    if access_token:
        sent = send_via_gmail_api(to_email, subject, content, access_token)
        if sent:
            return meet_link

    # 2. Fallback to standard SMTP if configured
    if SMTP_USER and SMTP_PASS:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = SMTP_FROM
            msg["To"] = to_email

            part_text = MIMEText(content, "plain")
            part_html = MIMEText(content.replace("\n", "<br>"), "html")
            msg.attach(part_text)
            msg.attach(part_html)

            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=5)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, [to_email], msg.as_string())
            server.quit()
            logger.info(f"Email sent successfully to {to_email} via SMTP fallback.")
            return meet_link
        except Exception as e:
            logger.warning(f"SMTP send fallback failed to {to_email}: {e}")

    logger.info(f"Email notification generated for {to_email}. Telehealth Link: {meet_link}")
    return meet_link

