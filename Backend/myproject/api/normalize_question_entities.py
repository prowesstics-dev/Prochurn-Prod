# normalize_question_entities.py
import re
import calendar
from .entity_cache import get_entities

# def normalize_question_entities(question: str) -> str:
#     q = question.lower()

#     # --- Normalize Months ---
#     months = {m.lower(): "<MONTH>" for m in calendar.month_name if m}
#     months.update({m.lower(): "<MONTH>" for m in calendar.month_abbr if m})
#     for m in months:
#         q = re.sub(rf"\b{m}\b", "<MONTH>", q)

#     # --- Normalize Years ---
#     q = re.sub(r"\b(20\d{2}|19\d{2})\b", "<YEAR>", q)

#     # --- Normalize Entities from DB ---
#     entities = get_entities()

#     for state in entities["state"]:
#         q = re.sub(rf"\b{re.escape(state)}\b", "<STATE>", q)

#     for zone in entities["zone"]:
#         q = re.sub(rf"\b{re.escape(zone)}\b", "<ZONE>", q)

#     for branch in entities["branch"]:
#         q = re.sub(rf"\b{re.escape(branch)}\b", "<BRANCH>", q)

#     return q



def normalize_question_entities(question: str) -> str:
    """Normalize question by replacing entities with placeholders"""
    q = question.lower()
     
    # --- Normalize Months ---
    months = {m.lower(): "<MONTH>" for m in calendar.month_name if m}
    months.update({m.lower(): "<MONTH>" for m in calendar.month_abbr if m})
    for m in months:
        q = re.sub(rf"\b{m}\b", "<MONTH>", q)
     
    # --- Normalize Years ---
    q = re.sub(r"\b(20\d{2}|19\d{2})\b", "<YEAR>", q)
     
    # --- Normalize Entities from DB ---
    entities = get_entities()
     
    for state in entities["state"]:
        q = re.sub(rf"\b{re.escape(state)}\b", "<STATE>", q, flags=re.IGNORECASE)
     
    for zone in entities["zone"]:
        q = re.sub(rf"\b{re.escape(zone)}\b", "<ZONE>", q, flags=re.IGNORECASE)
     
    for branch in entities["branch"]:
        q = re.sub(rf"\b{re.escape(branch)}\b", "<BRANCH>", q, flags=re.IGNORECASE)
     
    return q

