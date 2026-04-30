from fastapi import APIRouter, Request, BackgroundTasks, HTTPException
from app.core.config import settings
from app.services.telegram_bot import service as tg_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix=f"{settings.API_V1_STR}/telegram", tags=["telegram"])

@router.post("/webhook/{token}")
async def telegram_webhook(token: str, request: Request, background_tasks: BackgroundTasks):
    """
    Receive incoming Telegram messages.
    The path includes the bot token to ensure only Telegram can trigger this endpoint.
    """
    if token != settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid token")
        
    try:
        payload = await request.json()
        # Process the update in the background so we can respond to Telegram quickly
        background_tasks.add_task(tg_service.process_update, payload)
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {e}")
        return {"status": "error"}
