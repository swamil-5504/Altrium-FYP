"""
Telegram Notification Service.
Sends instant push notifications to users.
"""

import logging
import httpx
from app.core.config import settings
from .templates import (
    student_registration_msg,
    admin_verified_msg,
    degree_approved_msg,
    degree_rejected_msg,
    pending_reminder_msg
)

logger = logging.getLogger(__name__)

async def _send_msg(chat_id: str, text: str) -> bool:
    """Core Telegram API call."""
    if not settings.TELEGRAM_BOT_TOKEN:
        return False
        
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=5)
            return response.status_code == 200
    except Exception:
        return False

async def notify_registration(student_name: str, chat_id: str = None):
    """Notify student of registration."""
    if chat_id:
        await _send_msg(chat_id, student_registration_msg(student_name))

async def notify_verification(admin_name: str, college: str, chat_id: str = None):
    """Notify admin of verification."""
    if chat_id:
        await _send_msg(chat_id, admin_verified_msg(admin_name, college))

async def notify_degree_approval(student_name: str, degree_title: str, tx_hash: str | None, chat_id: str = None):
    """Notify student of degree approval."""
    if chat_id:
        await _send_msg(chat_id, degree_approved_msg(student_name, degree_title, tx_hash))

async def notify_degree_rejection(student_name: str, degree_title: str, reason: str = None, chat_id: str = None):
    """Notify student of degree rejection."""
    if chat_id:
        await _send_msg(chat_id, degree_rejected_msg(student_name, degree_title, reason))

async def notify_pending_reminder(admin_name: str, count: int, college: str, chat_id: str = None):
    """Notify admin of pending tasks."""
    if chat_id:
        await _send_msg(chat_id, pending_reminder_msg(admin_name, count, college))
