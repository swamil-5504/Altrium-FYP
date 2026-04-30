import logging
from app.models.models import User, Credential, CredentialStatus
from .service import _send_msg, _send_document

logger = logging.getLogger(__name__)

async def handle_intent(chat_id: str, intent: str, entities: dict):
    """Routes the intent to the appropriate handler function."""
    
    # 1. Identify User
    user = await User.find_one(User.telegram_id == str(chat_id))
    
    if intent == "start":
        await _send_msg(
            chat_id, 
            "🎓 <b>Welcome to Altrium Verification Bot!</b>\n\n"
            "I can help you check your degree status. Try asking:\n"
            "- 'Show my pending degrees'\n"
            "- 'What degrees have been minted?'\n"
            "- 'Show all my degrees'\n"
            "- 'Get my degree pdf'\n"
            "- 'Account status'"
        )
        return

    if not user:
        await _send_msg(
            chat_id, 
            "⚠️ <b>Account Not Linked</b>\n\n"
            "I couldn't find an account linked to this Telegram ID. "
            "Please ensure you have linked your Telegram in your Altrium dashboard."
        )
        return

    # Route based on intent
    if intent == "get_pending_degrees":
        await _handle_get_degrees(chat_id, user, CredentialStatus.PENDING, "Under Verification")
    elif intent == "get_minted_degrees":
        await _handle_get_degrees(chat_id, user, CredentialStatus.APPROVED, "Minted/Approved")
    elif intent == "get_all_degrees":
        await _handle_get_all_degrees(chat_id, user)
    elif intent == "get_status":
        await _handle_get_all_degrees(chat_id, user)
    elif intent == "get_account_info":
        await _handle_account_info(chat_id, user)
    elif intent == "get_degree_pdf":
        await _handle_get_degree_pdf(chat_id, user)
    else:
        await _send_msg(
            chat_id,
            "You can ask me things like:\n"
            "- 'Show my pending degrees'\n"
            "- 'What degrees have been minted?'\n"
            "- 'Get my degree pdf'\n"
            "- 'Account status'"
        )

async def _handle_get_degrees(chat_id: str, user: User, status: CredentialStatus, status_label: str):
    degrees = await Credential.find(
        Credential.issued_to_id == user.id,
        Credential.status == status
    ).to_list()
    
    if not degrees:
        await _send_msg(chat_id, f"You have <b>0</b> degrees currently {status_label.lower()}.")
        return
        
    msg = f"📜 <b>Your {status_label} Degrees ({len(degrees)})</b>\n\n"
    for deg in degrees:
        msg += f"🔸 <b>{deg.title}</b>\n"
        if deg.college_name:
            msg += f"   Institution: {deg.college_name}\n"
        if deg.tx_hash:
            msg += f"   Tx: <a href='https://sepolia.etherscan.io/tx/{deg.tx_hash}'>View on Explorer</a>\n"
        if deg.updated_at:
            msg += f"   Updated: {deg.updated_at.strftime('%Y-%m-%d %H:%M')}\n"
        msg += "\n"
        
    await _send_msg(chat_id, msg)

async def _handle_get_all_degrees(chat_id: str, user: User):
    degrees = await Credential.find(Credential.issued_to_id == user.id).to_list()
    
    if not degrees:
        await _send_msg(chat_id, "You don't have any degrees in the system yet.")
        return
        
    msg = f"📚 <b>All Your Degrees ({len(degrees)})</b>\n\n"
    for deg in degrees:
        status_emoji = "⏳" if deg.status == CredentialStatus.PENDING else "✅" if deg.status == CredentialStatus.APPROVED else "❌"
        msg += f"{status_emoji} <b>{deg.title}</b> - {deg.status.value}\n"
        
    await _send_msg(chat_id, msg)

async def _handle_account_info(chat_id: str, user: User):
    msg = (
        "👤 <b>Account Information</b>\n\n"
        f"<b>Name:</b> {user.full_name or 'N/A'}\n"
        f"<b>Email:</b> {user.email}\n"
        f"<b>Role:</b> {user.role.value}\n"
        f"<b>Last Active:</b> {user.updated_at.strftime('%Y-%m-%d %H:%M')}\n"
    )
    if user.prn_number:
        msg += f"<b>PRN:</b> {user.prn_number}\n"
    if user.college_name:
        msg += f"<b>Institution:</b> {user.college_name}\n"
        
    await _send_msg(chat_id, msg)

async def _handle_get_degree_pdf(chat_id: str, user: User):
    degrees = await Credential.find(
        Credential.issued_to_id == user.id,
        Credential.status == CredentialStatus.APPROVED
    ).to_list()
    
    if not degrees:
        await _send_msg(chat_id, "You don't have any approved degrees yet.")
        return
        
    await _send_msg(chat_id, f"I found {len(degrees)} approved degree(s). Fetching your PDFs...")
    
    from app.services.degree_service import DegreeService
    
    for deg in degrees:
        if not deg.document_path:
            await _send_msg(chat_id, f"⚠️ The degree <b>{deg.title}</b> does not have a PDF document attached.")
            continue
            
        try:
            pdf_bytes = await DegreeService.get_document_with_footer(deg.id, user)
            caption = f"Here is your official PDF for <b>{deg.title}</b>"
            filename = f"degree_{deg.title.replace(' ', '_')}.pdf"
            success = await _send_document(chat_id, pdf_bytes, filename, caption)
            if not success:
                await _send_msg(chat_id, f"❌ Failed to send PDF for <b>{deg.title}</b>.")
        except Exception as e:
            logger.error(f"Error fetching PDF for telegram bot: {e}")
            await _send_msg(chat_id, f"❌ Error retrieving PDF for <b>{deg.title}</b>.")
