import re
from typing import Tuple, Dict, Any

def parse_intent(text: str) -> Tuple[str, Dict[str, Any]]:
    """
    Parses natural language text into a structured intent.
    Returns a tuple of (intent_name, extracted_entities).
    """
    text = text.lower().strip()
    
    # 1. Pending / Under Verification Degrees
    if re.search(r'\b(pending|under verification|not verified yet|verifying)\b', text):
        return "get_pending_degrees", {}
        
    # 2. Minted / Approved Degrees
    if re.search(r'\b(minted|approved|issued|my certificates|my verified degrees)\b', text):
        return "get_minted_degrees", {}
        
    # 3. Specific Degree Status
    if re.search(r'\b(status of|is my degree verified|check degree)\b', text):
        return "get_status", {}
        
    # 4. All Degrees
    if re.search(r'\b(all degrees|my degrees|show degrees)\b', text):
        return "get_all_degrees", {}
        
    # 5. Last Login / Account info
    if re.search(r'\b(last login|account status|my info)\b', text):
        return "get_account_info", {}
        
    # 6. Get Degree PDF
    if re.search(r'\b(get my degree pdf|download my degree|send my pdf|my degree pdf|get pdf|download pdf)\b', text):
        return "get_degree_pdf", {}

    # 7. Start command
    if text.startswith("/start") or text.startswith("start"):
        return "start", {}
        
    # Default fallback
    return "help", {}
