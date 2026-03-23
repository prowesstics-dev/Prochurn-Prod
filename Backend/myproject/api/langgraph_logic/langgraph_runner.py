from typing import TypedDict
from langchain.prompts import PromptTemplate
from langgraph.graph import StateGraph
from langchain_core.runnables import RunnableSequence
from .db_embedding import get_context
from ..llm_runner.llm_config import get_llama_maverick_llm
from ..llm_runner.token_utils import truncate_text, estimate_tokens
import re
import json
import hashlib
from datetime import datetime
import calendar
import random
from typing import TypedDict, List, Dict, Any, Optional
from api.config import ROUND_PERCENTAGES


# Constants
MAX_TOTAL_TOKENS = 6000
RESERVED_FOR_RESPONSE = 1000
MAX_INPUT_TOKENS = MAX_TOTAL_TOKENS - RESERVED_FOR_RESPONSE

CURRENT_YEAR = datetime.now().year

class SQLState(TypedDict):
    question: str
    context: str
    sql: str
    explanation: str

class YearRangeDetector:
    """Enhanced year range detection and parsing"""
    
    @staticmethod
    def extract_year_filters(question: str):
        """Extract year filters from user question"""
        year_patterns = [
            r'(\d{4})\s*[-–—]\s*(\d{2})\b',  # 2022-25
            r'(\d{4})\s*[-–—]\s*(\d{4})\b',  # 2022-2025
            r'between\s+(\d{4})\s+and\s+(\d{4})\b',  # between 2022 and 2025
            r'from\s+(\d{4})\s+to\s+(\d{4})\b',  # from 2022 to 2025
            r'\b(\d{4})\s+to\s+(\d{4})\b',  # 2022 to 2025
        ]
        
        question_lower = question.lower()
        
        for pattern in year_patterns:
            match = re.search(pattern, question_lower)
            if match:
                start_year = int(match.group(1))
                end_year_str = match.group(2)
                
                # Handle 2-digit year format (25 -> 2025)
                if len(end_year_str) == 2:
                    # Assume 20XX for years 00-99
                    end_year = 2000 + int(end_year_str)
                else:
                    end_year = int(end_year_str)
                
                return {
                    'start_year': start_year,
                    'end_year': end_year,
                    'range_text': f"{start_year}-{end_year}",
                    'has_year_filter': True
                }
        
        # Check for single year
        single_year_match = re.search(r'\b(20\d{2})\b', question_lower)
        if single_year_match:
            year = int(single_year_match.group(1))
            return {
                'start_year': year,
                'end_year': year,
                'range_text': str(year),
                'has_year_filter': True
            }
        
        return {'has_year_filter': False}
    
    @staticmethod
    def is_year_specific_query(question: str) -> bool:
        """Check if query has year-specific patterns that should bypass cache"""
        year_indicators = [
            r'\d{4}\s*[-–—]\s*\d{2,4}',  # Year ranges
            r'between\s+\d{4}\s+and\s+\d{4}',  # between years
            r'from\s+\d{4}\s+to\s+\d{4}',  # from year to year
            r'in\s+\d{4}',  # in specific year
            r'\d{4}\s+to\s+\d{4}',  # year to year
        ]
        
        return any(re.search(pattern, question.lower()) for pattern in year_indicators)

class EnhancedQueryCache:
    """Smart caching that respects year ranges and context"""
    
    def __init__(self):
        self.cache = {}
    
    def _generate_cache_key(self, question: str, user_id: str, year_filters: dict) -> str:
        """Generate cache key that includes year filters"""
        normalized_question = re.sub(r'\s+', ' ', question.lower().strip())
        
        # Remove specific year references for base question matching
        base_question = re.sub(r'\b\d{4}[-–—]\d{2,4}\b', '[YEAR_RANGE]', normalized_question)
        base_question = re.sub(r'\bbetween\s+\d{4}\s+and\s+\d{4}\b', '[YEAR_RANGE]', base_question)
        
        cache_data = {
            'base_question': base_question,
            'year_filters': year_filters,
            'user_id': user_id
        }
        
        return hashlib.md5(json.dumps(cache_data, sort_keys=True).encode()).hexdigest()
    
    def should_use_cache(self, question: str, user_id: str) -> bool:
        """Determine if we should use cache for this query"""
        # Never cache year-specific queries
        if YearRangeDetector.is_year_specific_query(question):
            return False
        
        # Check for follow-up indicators that modify previous queries
        follow_up_patterns = [
            r'based on this',
            r'from this',
            r'how many are',
            r'what about',
            r'in this case',
            r'for \d{4}',  # for specific year
        ]
        
        return not any(re.search(pattern, question.lower()) for pattern in follow_up_patterns)

def trim_history(history, max_words=1500):
    """Enhanced history trimming with year range preservation"""
    trimmed = []
    word_count = 0
    for item in reversed(history):
        # Preserve year range context in history
        entry = f"Q: {item['question']}\nSQL: {item['sql']}"
        words = len(entry.split())
        if word_count + words > max_words:
            break
        trimmed.append(entry)
        word_count += words
    return "\n".join(reversed(trimmed))


FULL_SCHEMA = '''
Table: "bi_dwh"."main_cai_lib"
Columns:
- own_damage_premium
- vehicle_age
- third_party_premium
- total_premium_payable
- vehicle_idv
- total_revenue
- policy_tenure
- number_of_claims
- claims_approved
- claim_approval_rate
- customer_tenure
- customer_life_time_value
- customerid
- chassis_number
- engine_number
- vehicle_register_number
- state
- zone
- business_type
- car_manufacturer
- vehicle_model
- product_name
- policy_no
- tie_up
- vehicle_model_variant
- policy_start_date_year
- policy_end_date_year
- policy_start_date_month
- policy_end_date_month
- is_churn
- customer_segment
- branch_name
- main_churn_reason
- primary_recommendation
- insured_client_name
'''

# --- sql_fixers.py (or keep inline) ---
import re
def _strip_code_fences(s: str) -> str:
    if not s:
        return s
    m = re.search(r'```sql\s+(.*?)```', s, flags=re.S | re.I)
    if m: return m.group(1).strip()
    m = re.search(r'```\s*(.*?)```', s, flags=re.S)
    if m: return m.group(1).strip()
    return s.strip()

def normalize_sql_text(raw: str) -> str:
    """
    Only remove 'SQL:' label and code fences.
    DO NOT trim to the first SELECT — keep leading WITH CTEs intact.
    """
    s = (raw or "").strip()
    s = re.sub(r'^\s*SQL\s*:\s*', '', s, flags=re.I)
    return _strip_code_fences(s)

def _extract_where_clause(sql: str) -> str:
    """
    Use the *last* WHERE in the statement (outer if present, else inner)
    to build time_context. Falls back to 1=1.
    """
    s = (sql or "").strip().rstrip(';')
    matches = list(re.finditer(
        r'\bWHERE\b(.+?)(?:\bGROUP\s+BY\b|\bORDER\s+BY\b|\bLIMIT\b|$)',
        s, flags=re.I | re.S
    ))
    return matches[-1].group(1).strip() if matches else "1=1"

def _has_time_scope(sql: str) -> bool:
    return bool(re.search(r'\b(min_year|max_year|time_context)\b', (sql or ""), flags=re.I))

# def ensure_time_scope(sql: str) -> str:
#     """
#     Always add min_year/max_year/year_count/month_count WITHOUT nesting a CTE badly.
#     Strategy:
#       WITH time_context AS (... WHERE <derived> ...)
#       SELECT b.*, tc.*
#       FROM ( <original SQL> ) AS b
#       CROSS JOIN time_context tc;
#     This works even if the original SQL starts with WITH.
#     """
#     s = (sql or "").strip()
#     s = re.sub(r'^\s*SQL\s*:\s*', '', s, flags=re.I).strip()
#     s = _strip_code_fences(s)

#     if _has_time_scope(s):
#         return s.rstrip(';') + ';'

#     where_clause = _extract_where_clause(s)
#     wrapped = f"""
# WITH time_context AS (
#   SELECT
#     MIN(policy_end_date_year) AS min_year,
#     MAX(policy_end_date_year) AS max_year,
#     COUNT(DISTINCT policy_end_date_year) AS year_count,
#     COUNT(DISTINCT policy_end_date_month) AS month_count
#   FROM "bi_dwh"."main_cai_lib"
#   WHERE {where_clause}
# )
# SELECT b.*, tc.min_year, tc.max_year, tc.year_count, tc.month_count
# FROM (
# {s.rstrip(';')}
# ) AS b
# CROSS JOIN time_context tc;
# """.strip()
#     return wrapped


def ensure_time_scope(sql: str) -> str:
    """
    ONLY add time_context wrapper if:
    1. Query doesn't already have time_context CTE
    2. Query needs aggregated time metadata (year_count, month_count)
    3. Query is doing GROUP BY or complex aggregations
    
    DON'T wrap simple filtered queries like "show policies for 2023"
    """
    s = (sql or "").strip()
    s = re.sub(r'^\s*SQL\s*:\s*', '', s, flags=re.I).strip()
    s = _strip_code_fences(s)

    # Already has time_context? Return as-is
    if _has_time_scope(s):
        return s.rstrip(';') + ';'
    
    # Check if this is a simple filtered query (no aggregations needed)
    is_simple_filter = bool(
        re.search(r'SELECT\s+\*\s+FROM.*WHERE\s+policy_end_date_year\s*=', s, re.IGNORECASE | re.DOTALL)
    )
    
    # Check if query has GROUP BY or aggregations that would benefit from time_context
    needs_time_metadata = bool(
        re.search(r'\b(GROUP\s+BY|COUNT\(|SUM\(|AVG\(|year_count|month_count)\b', s, re.IGNORECASE)
    )
    
    # Don't wrap simple filters - they don't need min_year/max_year metadata
    if is_simple_filter and not needs_time_metadata:
        return s.rstrip(';') + ';'
    
    # Only wrap if query actually needs aggregated time context
    if not needs_time_metadata:
        return s.rstrip(';') + ';'
    
    # Wrap with time_context for complex queries
    where_clause = _extract_where_clause(s)
    wrapped = f"""
WITH time_context AS (
  SELECT
    MIN(policy_end_date_year) AS min_year,
    MAX(policy_end_date_year) AS max_year,
    COUNT(DISTINCT policy_end_date_year) AS year_count,
    COUNT(DISTINCT policy_end_date_month) AS month_count
  FROM "bi_dwh"."main_cai_lib"
  WHERE {where_clause}
)
SELECT b.*, tc.min_year, tc.max_year, tc.year_count, tc.month_count
FROM (
{s.rstrip(';')}
) AS b
CROSS JOIN time_context tc;
""".strip()
    
    return wrapped

def ensure_time_scope2912(sql: str) -> str:
    """
    ONLY wrap SQL with time_context if it has time filters
    and doesn't already have a time_context CTE
    """
    # If already has time_context CTE, return as-is
    if re.search(r'WITH\s+time_context\s+AS', sql, re.IGNORECASE):
        return sql
    
    # If no time filters present, return as-is
    has_time_filter = bool(
        re.search(r'policy_end_date_(year|month)\s*=', sql, re.IGNORECASE)
    )
    
    if not has_time_filter:
        return sql
    
    s = (sql or "").strip()
    s = re.sub(r'^\s*SQL\s*:\s*', '', s, flags=re.I).strip()
    s = _strip_code_fences(s)

    if _has_time_scope(s):
        return s.rstrip(';') + ';'

    where_clause = _extract_where_clause(s)
    wrapped = f"""
WITH time_context AS (
  SELECT
    MIN(policy_end_date_year) AS min_year,
    MAX(policy_end_date_year) AS max_year,
    COUNT(DISTINCT policy_end_date_year) AS year_count,
    COUNT(DISTINCT policy_end_date_month) AS month_count
  FROM "bi_dwh"."main_cai_lib"
  WHERE {where_clause}
)
SELECT b.*, tc.min_year, tc.max_year, tc.year_count, tc.month_count
FROM (
{s.rstrip(';')}
) AS b
CROSS JOIN time_context tc;
""".strip()
    
    return sql  # or your wrapped SQL


# def sanitize_and_wrap_sql(raw_sql: str) -> str:
#     """
#     1) Strip 'SQL:' / code fences
#     2) Fix the dangling ') SELECT' pattern by turning the first SELECT into a CTE,
#        and make the second SELECT read FROM that CTE
#     3) Add the time_context wrapper so the result always includes time scope
#     """
#     s = _strip_code_fences(re.sub(r'^\s*SQL\s*:\s*', '', (raw_sql or ''), flags=re.I))

#     # Fix common LLM glitch: "<SELECT ...> ) SELECT ... FROM branch_performance"
#     if re.search(r'\)\s*SELECT', s, flags=re.I) and not re.search(r'^\s*WITH\b', s, flags=re.I):
#         first, rest = re.split(r'\)\s*SELECT', s, 1, flags=re.I)
#         rest = 'SELECT' + rest
#         # Point second SELECT to the CTE we’re about to create
#         rest = re.sub(r'\bFROM\s+branch_performance(\s+\w+)?\b', r'FROM base_result\1', rest, flags=re.I)
#         rest = re.sub(r'\bJOIN\s+branch_performance(\s+\w+)?\b', r'JOIN base_result\1', rest, flags=re.I)
#         s = f"WITH base_result AS (\n{first.strip()}\n)\n{rest.strip()}"

#     # Finally, ensure time scope
#     return ensure_time_scope(s)


def enforce_not_nulls(sql: str, cols: list[str]) -> str:
    """
    Ensures all given cols are filtered as NOT NULL (and not 'None')
    """
    for col in cols:
        pattern = fr'\b{col}\b'
        if re.search(pattern, sql, re.I):
            if re.search(fr'{col}\s+IS\s+NOT\s+NULL', sql, re.I):
                continue  # already handled
            # inject into WHERE or add WHERE if missing
            if re.search(r'\bWHERE\b', sql, re.I):
                sql = re.sub(r'(\bWHERE\b)', fr'\1 {col} IS NOT NULL AND ', sql, count=1, flags=re.I)
            else:
                sql += f"\nWHERE {col} IS NOT NULL"
            # also remove 'None' text values
            sql = re.sub(fr'{col}\s+ILIKE\s+\'None\'', f'{col} IS NOT NULL', sql, flags=re.I)
    return sql

# def sanitize_and_wrap_sql(raw_sql: str) -> str:
#     """
#     Cleans and wraps LLM SQL output:
#     1) Strip 'SQL:' / code fences
#     2) Fix dangling ') SELECT' into valid CTE
#     3) Add time_context wrapper
#     4) Drop invalid outer WHERE filters for columns not in projection
#     """
#     s = _strip_code_fences(
#         re.sub(r'^\s*SQL\s*:\s*', '', (raw_sql or ''), flags=re.I)
#     )

#     # Fix common LLM glitch: ") SELECT"
#     if re.search(r'\)\s*SELECT', s, flags=re.I) and not re.search(r'^\s*WITH\b', s, flags=re.I):
#         first, rest = re.split(r'\)\s*SELECT', s, 1, flags=re.I)
#         rest = 'SELECT' + rest
#         rest = re.sub(r'\bFROM\s+branch_performance(\s+\w+)?\b', r'FROM base_result\1', rest, flags=re.I)
#         rest = re.sub(r'\bJOIN\s+branch_performance(\s+\w+)?\b', r'JOIN base_result\1', rest, flags=re.I)
#         s = f"WITH base_result AS (\n{first.strip()}\n)\n{rest.strip()}"

#     # --- Step 1: detect projection columns ---
#     outer_select_match = re.search(r'SELECT\s+(.*?)\s+FROM', s, flags=re.I | re.S)
#     projection_cols = []
#     if outer_select_match:
#         projection_text = outer_select_match.group(1)
#         # crude split on commas, strip aliases
#         projection_cols = [c.split()[-1].strip() for c in projection_text.split(',')]
#         projection_cols = [c.lower() for c in projection_cols]

#     # --- Step 2: drop invalid filters ---
#     def drop_invalid_filters(sql: str) -> str:
#         where_match = re.search(r'\bWHERE\b(.*)', sql, flags=re.I | re.S)
#         if not where_match:
#             return sql
#         where_clause = where_match.group(1)

#         valid_parts = []
#         for cond in re.split(r'\s+AND\s+', where_clause, flags=re.I):
#             col = cond.split()[0].replace('"', '').lower()
#             if col in projection_cols:
#                 valid_parts.append(cond.strip())
#             else:
#                 print(f"⚠️ Dropping invalid filter: {cond.strip()}")
#         if valid_parts:
#             new_where = " WHERE " + " AND ".join(valid_parts)
#         else:
#             new_where = ""
#         return re.sub(r'\bWHERE\b.*', new_where, sql, flags=re.I | re.S)

#     # s = drop_invalid_filters(s)
#     critical_cols = ["customer_segment", "is_churn", "policy_end_date_year", 
#                      "policy_end_date_month", "main_churn_reason"]
#     s = enforce_not_nulls(s, critical_cols)

#     return ensure_time_scope(s)


# def sanitize_and_wrap_sql(raw_sql: str) -> str:
#     """
#     Cleans and wraps LLM SQL output:
#     1) Strip 'SQL:' / code fences
#     2) Fix dangling ') SELECT' into valid CTE
#     3) Merge multiple WITH blocks
#     4) Add time_context wrapper
#     5) Drop invalid outer WHERE filters for columns not in projection
#     """
#     s = _strip_code_fences(
#         re.sub(r'^\s*SQL\s*:\s*', '', (raw_sql or ''), flags=re.I)
#     ).strip()

#     # --- Fix common glitch: stray ') SELECT'
#     s = re.sub(r'\)\s*SELECT', ') \nSELECT', s, flags=re.I)

#     # --- Merge multiple WITH blocks ---
#     # If query has more than one WITH, stitch them together
#     parts = re.split(r'\bWITH\b', s, flags=re.I)
#     if len(parts) > 2:  # means multiple WITH
#         head = parts[0]
#         with_blocks = parts[1:]
#         # rebuild as single WITH …, cte2 AS (…), … SELECT …
#         ctes = []
#         final_select = None
#         for blk in with_blocks:
#             if re.search(r'\bSELECT\b', blk, flags=re.I):
#                 # split on first SELECT … FROM
#                 m = re.split(r'\bSELECT\b', blk, 1, flags=re.I)
#                 if len(m) == 2:
#                     maybe_cte, remainder = m
#                     if ')' in maybe_cte:  # it's a CTE
#                         ctes.append("SELECT" + remainder)
#                     else:
#                         final_select = "SELECT" + remainder
#                 else:
#                     final_select = "WITH " + blk
#             else:
#                 ctes.append(blk)
#         if ctes:
#             s = "WITH " + ",\n".join(ctes) + "\n" + (final_select or "")
    
#     # --- Step: enforce NOT NULLs for critical columns ---
#     critical_cols = ["customer_segment", "is_churn", "policy_end_date_year",
#                      "policy_end_date_month", "main_churn_reason"]
#     s = enforce_not_nulls(s, critical_cols)

#     return ensure_time_scope(s)


#     # Finally, ensure time scope wrapper
#     # return ensure_time_scope(s)

# def sanitize_and_wrap_sql(raw_sql: str) -> str:
#     """
#     Cleans and wraps LLM SQL output:
#     1) Strip 'SQL:' / code fences
#     2) Fix dangling ') SELECT' into valid CTE
#     3) Merge multiple WITH blocks
#     4) Add time_context wrapper
#     5) Drop invalid outer WHERE filters for columns not in projection
#     6) Fix dangling conditions after FROM
#     """
#     s = _strip_code_fences(
#         re.sub(r'^\s*SQL\s*:\s*', '', (raw_sql or ''), flags=re.I)
#     ).strip()

#     # --- Fix common glitch: stray ') SELECT'
#     s = re.sub(r'\)\s*SELECT', ') \nSELECT', s, flags=re.I)

#     # --- Merge multiple WITH blocks ---
#     parts = re.split(r'\bWITH\b', s, flags=re.I)
#     if len(parts) > 2:  # means multiple WITH
#         head = parts[0]
#         with_blocks = parts[1:]
#         ctes = []
#         final_select = None
#         for blk in with_blocks:
#             if re.search(r'\bSELECT\b', blk, flags=re.I):
#                 m = re.split(r'\bSELECT\b', blk, 1, flags=re.I)
#                 if len(m) == 2:
#                     maybe_cte, remainder = m
#                     if ')' in maybe_cte:
#                         ctes.append("SELECT" + remainder)
#                     else:
#                         final_select = "SELECT" + remainder
#                 else:
#                     final_select = "WITH " + blk
#             else:
#                 ctes.append(blk)
#         if ctes:
#             s = "WITH " + ",\n".join(ctes) + "\n" + (final_select or "")

#     # --- Enforce NOT NULLs for critical columns ---
#     critical_cols = ["customer_segment", "is_churn", "policy_end_date_year",
#                      "policy_end_date_month", "main_churn_reason"]
#     s = enforce_not_nulls(s, critical_cols)

#     # --- 🚑 FIX dangling conditions after FROM ---
#     # e.g. FROM "bi_dwh"."main_cai_lib" is_churn ILIKE 'Not Renewed'
#     s = re.sub(
#         r'("main_cai_lib"\s+)(\w+\s+ILIKE)',
#         r'\1WHERE \2',
#         s,
#         flags=re.IGNORECASE
#     )

#     # --- Ensure time scope wrapper ---
#     return ensure_time_scope(s)



def sanitize_and_wrap_sql(raw_sql: str) -> str:
    """
    Cleans and wraps LLM SQL output:
    1) Strip 'SQL:' / code fences
    2) Fix dangling ') SELECT' into valid CTE
    3) Merge multiple WITH blocks
    4) Add time_context wrapper ONLY if LLM explicitly generated it
    5) Drop invalid outer WHERE filters for columns not in projection
    6) Fix dangling conditions after FROM
    """
    s = _strip_code_fences(
        re.sub(r'^\s*SQL\s*:\s*', '', (raw_sql or ''), flags=re.I)
    ).strip()

    # --- Fix common glitch: stray ') SELECT'
    s = re.sub(r'\)\s*SELECT', ') \nSELECT', s, flags=re.I)

    # --- Merge multiple WITH blocks ---
    parts = re.split(r'\bWITH\b', s, flags=re.I)
    if len(parts) > 2:  # means multiple WITH
        head = parts[0]
        with_blocks = parts[1:]
        ctes = []
        final_select = None
        for blk in with_blocks:
            if re.search(r'\bSELECT\b', blk, flags=re.I):
                m = re.split(r'\bSELECT\b', blk, 1, flags=re.I)
                if len(m) == 2:
                    maybe_cte, remainder = m
                    if ')' in maybe_cte:
                        ctes.append("SELECT" + remainder)
                    else:
                        final_select = "SELECT" + remainder
                else:
                    final_select = "WITH " + blk
            else:
                ctes.append(blk)
        if ctes:
            s = "WITH " + ",\n".join(ctes) + "\n" + (final_select or "")

    # --- Enforce NOT NULLs for critical columns ---
    critical_cols = ["customer_segment", "is_churn", "main_churn_reason"]
    s = enforce_not_nulls(s, critical_cols)

    # --- 🚑 FIX dangling conditions after FROM ---
    s = re.sub(
        r'("main_cai_lib"\s+)(\w+\s+ILIKE)',
        r'\1WHERE \2',
        s,
        flags=re.IGNORECASE
    )

    # --- 🔥 ONLY add time_context if LLM explicitly generated it
    # Do NOT auto-wrap simple year/month filters
    has_time_context_cte = bool(
        re.search(r'WITH\s+time_context\s+AS', s, re.IGNORECASE)
    )
    
    if has_time_context_cte:
        # LLM wanted time context for analytics, ensure it's properly formatted
        return ensure_time_scope(s)
    else:
        # Simple query, don't add unnecessary wrapper
        return s

def sanitize_and_wrap_sql2912(raw_sql: str) -> str:
    """
    Cleans and wraps LLM SQL output:
    1) Strip 'SQL:' / code fences
    2) Fix dangling ') SELECT' into valid CTE
    3) Merge multiple WITH blocks
    4) Add time_context wrapper ONLY if query has time filters
    5) Drop invalid outer WHERE filters for columns not in projection
    6) Fix dangling conditions after FROM
    """
    s = _strip_code_fences(
        re.sub(r'^\s*SQL\s*:\s*', '', (raw_sql or ''), flags=re.I)
    ).strip()

    # --- Fix common glitch: stray ') SELECT'
    s = re.sub(r'\)\s*SELECT', ') \nSELECT', s, flags=re.I)

    # --- Merge multiple WITH blocks ---
    parts = re.split(r'\bWITH\b', s, flags=re.I)
    if len(parts) > 2:  # means multiple WITH
        head = parts[0]
        with_blocks = parts[1:]
        ctes = []
        final_select = None
        for blk in with_blocks:
            if re.search(r'\bSELECT\b', blk, flags=re.I):
                m = re.split(r'\bSELECT\b', blk, 1, flags=re.I)
                if len(m) == 2:
                    maybe_cte, remainder = m
                    if ')' in maybe_cte:
                        ctes.append("SELECT" + remainder)
                    else:
                        final_select = "SELECT" + remainder
                else:
                    final_select = "WITH " + blk
            else:
                ctes.append(blk)
        if ctes:
            s = "WITH " + ",\n".join(ctes) + "\n" + (final_select or "")

    # --- Enforce NOT NULLs for critical columns ---
    critical_cols = ["customer_segment", "is_churn", "main_churn_reason"]
    s = enforce_not_nulls(s, critical_cols)

    # --- 🚑 FIX dangling conditions after FROM ---
    # e.g. FROM "bi_dwh"."main_cai_lib" is_churn ILIKE 'Not Renewed'
    s = re.sub(
        r'("main_cai_lib"\s+)(\w+\s+ILIKE)',
        r'\1WHERE \2',
        s,
        flags=re.IGNORECASE
    )


    # --- Return cleaned SQL as-is (trust LLM's complexity decision) ---
    return s.rstrip(';') + ';'

    # --- 🔥 CRITICAL FIX: Only add time_context if LLM already included one
    # OR if the query has explicit time filters
    # has_time_filter = bool(
    #     re.search(r'policy_end_date_(year|month)\s*=', s, re.IGNORECASE)
    # )
    
    # Check if LLM already generated time_context CTE
    # has_time_context_cte = bool(
    #     re.search(r'WITH\s+time_context\s+AS', s, re.IGNORECASE)
    # )
    
    # Only wrap with time_context if:
    # 1. LLM generated time_context CTE (keep it as-is), OR
    # 2. Query has time filters but no CTE yet (add wrapper)
    # if has_time_filter or has_time_context_cte:
    #     return ensure_time_scope(s)
    # else:
    #     # No time filters, no time_context needed
    #     return s



def enforce_not_renewed_only(sql: str) -> str:
    """
    Ensures that for customer segment queries,
    we always filter only Not Renewed customers.
    """
    lower_sql = sql.lower()
    if "customer_segment" in lower_sql:
        # If already filtered by is_churn, replace it
        sql = re.sub(r"is_churn\s+ilike\s+'renewed'", "is_churn ILIKE 'Not Renewed'", sql, flags=re.I)
        # If no churn filter present, add it before GROUP BY or end
        if "is_churn" not in lower_sql:
            if "group by" in lower_sql:
                sql = sql.replace("GROUP BY", "AND is_churn ILIKE 'Not Renewed'\nGROUP BY")
            else:
                sql = sql.rstrip(";") + " AND is_churn ILIKE 'Not Renewed';"
    return sql

def remove_nulls_from_sql(sql: str) -> str:
    """
    Wraps the generated SQL to drop rows with NULL in key business columns.
    You can extend this as needed for churn, segmentation, etc.
    """
    sql = sql.strip().rstrip(";")

    critical_cols = ["customer_segment", "is_churn", "churn_rate", "policy_end_date_year"]

    # Build WHERE conditions dynamically
    not_null_conditions = " AND ".join([f"{col} IS NOT NULL" for col in critical_cols])

    wrapped_sql = f"""
    SELECT *
    FROM ({sql}) t
    WHERE {not_null_conditions}
    """
    return wrapped_sql





"""
PRODUCTION-READY FIX: Yes/No Questions + SQL LIMIT Control
Fixes:
1. Yes/No question detection and appropriate openers
2. Removes LIMIT 10 constraint for accurate answers
3. SQL sanitization improvements
"""

import re
import json
from typing import List, Dict, Any
import random


# ============================================================
# FIX 1: YES/NO QUESTION DETECTION
# ============================================================

def is_yes_no_question(question: str) -> bool:
    """Detect if question expects a yes/no answer"""
    q = question.lower().strip()
    
    # Direct yes/no patterns
    yes_no_patterns = [
        r'^is there\b',
        r'^are there\b',
        r'^do we have\b',
        r'^does\b',
        r'^is\b',
        r'^are\b',
        r'^can\b',
        r'^did\b',
        r'^was\b',
        r'^were\b',
        r'^has\b',
        r'^have\b',
        r'^will\b',
        r'^would\b',
        r'^should\b',
    ]
    
    for pattern in yes_no_patterns:
        if re.search(pattern, q):
            return True
    
    return False


def generate_yes_no_opener(question: str, row_count: int) -> str:
    """Generate appropriate opener for yes/no questions based on actual results"""
    q = question.lower()
    
    # Extract the subject from question
    if "renewed customer" in q:
        subject = "renewed customers"
    elif "churn" in q:
        subject = "churned customers"
    elif "claim" in q:
        subject = "claims"
    elif "policy" in q or "policies" in q:
        subject = "policies"
    elif "branch" in q:
        subject = "branches"
    elif "customer" in q:
        subject = "customers"
    else:
        subject = "records"
    
    # Extract time context
    year_match = re.search(r'\b(20\d{2})\b', question)
    time_context = f"for {year_match.group(1)}" if year_match else ""
    
    if row_count > 0:
        return f"Yes, we found {row_count:,} {subject} {time_context}."
    else:
        return f"No, there are no {subject} {time_context} in our records."


# ============================================================
# FIX 2: REMOVE LIMIT CONSTRAINTS FROM SQL
# ============================================================

def remove_unsafe_limit(sql: str, question: str) -> str:
    """
    Remove LIMIT constraints that would truncate results for counting/existence queries.
    Only keep LIMIT for preview/sampling questions.
    """
    # Check if question is asking for counts or yes/no
    q = question.lower()
    
    is_counting_query = any(word in q for word in [
        'how many', 'count', 'total', 'number of',
        'is there', 'are there', 'do we have', 'any'
    ])
    
    # For counting/existence queries, remove LIMIT entirely
    if is_counting_query:
        # Remove LIMIT clause completely
        sql = re.sub(r'\s+LIMIT\s+\d+\s*;?\s*$', '', sql, flags=re.IGNORECASE)
        print(f"✅ Removed LIMIT for counting query")
        return sql.strip()
    
    # For other queries, keep reasonable LIMIT
    if 'LIMIT' not in sql.upper():
        sql = sql.rstrip(';') + ' LIMIT 100000'
        print(f"✅ Added safety LIMIT 100000 for non-counting query")
        
    
    return sql.strip()


# ============================================================
# FIX 4: UPDATED SUMMARY GENERATION
# ============================================================

def generate_summary_from_rows(question, sql, rows, max_bullets: int = 6, db_connection=None, existing_summary=None):
    """
    SQL-TRUTH summary generator with Yes/No support.
    """
    # Use existing summary if valid
    if existing_summary:
        total_rows = len(rows) if isinstance(rows, list) else 0
        total_str = f"{total_rows:,}"
        if total_str in existing_summary or str(total_rows) in existing_summary:
            return existing_summary

    try:
        total_rows = len(rows) if isinstance(rows, list) else 0

        # ========== EMPTY RESULT ==========
        if not rows or (isinstance(rows, list) and len(rows) == 0):
            # For yes/no questions, give direct answer
            if is_yes_no_question(question):
                return generate_yes_no_opener(question, 0)
            return "No results found."

        # Convert Decimals to float
        rows = _convert_decimals_to_float(rows)

        

        # 🚨 KPI SAFETY: Never rescale percentages in narrative
        for row in rows:
            for k, v in row.items():
                if isinstance(v, (int, float)):
                    # If SQL already returned percentage, keep as-is
                    if k.endswith("_percentage"):
                        continue

                    # If metric name implies rate but value <= 1 → DO NOT convert
                    if "rate" in k.lower() and v <= 1:
                        # Explicitly mark as fraction to prevent later scaling
                        row[k] = round(v, 4)


        # ========== YES/NO QUESTIONS ==========
        if is_yes_no_question(question):
            return generate_yes_no_opener(question, total_rows)

        # ========== SINGLE METRIC ==========
        # if (
        #     isinstance(rows, list)
        #     and len(rows) == 1
        #     and isinstance(rows[0], dict)
        #     and len(rows[0]) == 1
        #     and isinstance(next(iter(rows[0].values())), (int, float))
        # ):
        #     col, val = next(iter(rows[0].items()))
        #     return (
        #         f"The query returned a single result.\n\n"
        #         f"- {col.replace('_',' ').title()}: {val:,}"
        #     )

        # ========== SINGLE METRIC ==========
        if (
            isinstance(rows, list)
            and len(rows) == 1
            and isinstance(rows[0], dict)
            and len(rows[0]) == 1
            and isinstance(next(iter(rows[0].values())), (int, float))
        ):
            col, val = next(iter(rows[0].items()))
            return f"{col.replace('_',' ').title()}: {val:,}"



        # ========== ROW-LEVEL RESULT ==========
        columns = list(rows[0].keys())
        clean_columns = [col.replace('_', ' ').title() for col in columns]

        return (
            f"Found {total_rows:,} records.\n\n"
            f"Fields: {', '.join(clean_columns)}."
        )

    except Exception as e:
        print(f"⚠️ Summary generation error: {e}")
        total = len(rows) if isinstance(rows, list) else 0
        
        # Even in error, handle yes/no appropriately
        if is_yes_no_question(question):
            return generate_yes_no_opener(question, total)
        
        return (
            f"Summary generation encountered an error.\n\n"
            f"Total records: {total:,}\n"
            f"Please retry or contact support."
        )



def remove_unsafe_limit(sql: str, question: str) -> str:
    """
    Remove LIMIT constraints that would truncate results for counting/existence queries.
    """
    q = question.lower()
    
    # Check if it's a yes/no question
    is_yes_no = is_yes_no_question(question)
    
    # Check if question is asking for counts or yes/no
    is_counting_query = any(word in q for word in [
        'how many', 'count', 'total', 'number of',
        'is there', 'are there', 'do we have', 'any'
    ])
    
    # For yes/no OR counting queries, remove LIMIT entirely
    if is_yes_no or is_counting_query:
        # Remove LIMIT clause completely
        sql = re.sub(r'\s+LIMIT\s+\d+\s*;?\s*$', '', sql, flags=re.IGNORECASE)
        print(f"✅ Removed LIMIT for yes/no/counting query")
        return sql.strip()
    
    # For other queries, keep reasonable LIMIT
    # if 'LIMIT' not in sql.upper():
    #     sql = sql.rstrip(';') + ' LIMIT 100000'
    #     print(f"✅ Added safety LIMIT 100000 for non-counting query")
    
    return sql.strip()

def run_sql_generation_graph(question, user_id, db_id, history: List[Dict[str, str]] = []):
    def retrieve_context_node(state):
        state["context"] = FULL_SCHEMA
        return state

    def generate_sql_node(state):
        history_context = trim_history(history)


        prompt = PromptTemplate.from_template(f"""You are a PostgreSQL SQL expert.

🚨 **CRITICAL CONSISTENCY RULE - READ FIRST:**

For SIMPLE DATA RETRIEVAL queries (list, show, provide, get details):
- Use ONLY filters explicitly mentioned in the question
- DO NOT add business logic filters like main_churn_reason, is_churn unless asked
- Keep queries minimal and consistent

Examples:
❌ WRONG: "provide details of vehicles expiring in Feb 2025"
→ Adding: WHERE main_churn_reason IS NOT NULL (NOT ASKED FOR!)

✅ CORRECT: "provide details of vehicles expiring in Feb 2025"
→ Use only: WHERE policy_end_date_year = 2025 AND policy_end_date_month = 2

Only add business filters when explicitly requested:
- "vehicles that churned" → Add is_churn filter
- "vehicles with churn reason" → Add main_churn_reason filter
- "vehicles expiring" → NO business filters, just date
                                              
Your task is two-fold:
1. Generate the SQL query
2. Provide a professional, actionable recommendation (1–3 lines) derived from the query output 
   that tells the user what they can do next to enhance business performance (e.g., reduce churn, 
   increase revenue, improve customer retention).
                                              
Only use this table and its columns: "bi_dwh"."main_cai_lib"



🚨 **YES/NO QUESTION RULE - CRITICAL:**

**BEFORE generating SQL, detect if this is a yes/no question:**
- Patterns: "Is there", "Are there", "Do we have", "Does", "Is", "Are", "Can", "Did", "Was", "Were"

**FOR YES/NO QUESTIONS:**
- ❌ NEVER add LIMIT clause
- ✅ Return ALL matching records (system will count them)
- ✅ Use simple SELECT with WHERE filters
- The answer depends on COUNT > 0, so we need all results
                                              

🔒 RULE (must enforce globally)

If a column represents a rate shown to users, SQL must return a percentage (×100).
                                              
🔒 Rule (must be enforced everywhere)

If a value is shown as a percentage in UI, it MUST be calculated as a percentage in SQL.

**Examples:**

Q: "Is there any renewed customers for 2025?"
→ This is YES/NO question
→ Generate:
```sql
SELECT 
  customerid,
  insured_client_name,
  policy_no
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year = 2025
  AND is_churn ILIKE 'Renewed'
  AND customerid IS NOT NULL;
-- ❌ NO LIMIT CLAUSE for yes/no questions
```

Q: "Are there any high-risk customers in Mumbai?"
→ This is YES/NO question
→ Generate without LIMIT

Q: "Do we have policies ending in March?"
→ This is YES/NO question  
→ Generate without LIMIT

**FOR LISTING QUESTIONS (not yes/no):**
- If singular ("Which customer...") → Add LIMIT 1
- If plural ("Which customers...") → No LIMIT or user-specified LIMIT

🚨 **CRITICAL TIME FILTER RULE - READ CAREFULLY:**

═══════════════════════════════════════════════════════════════════════════════
⚡ MASTER RULE: DO NOT USE time_context CTE FOR SIMPLE DATA RETRIEVAL
═══════════════════════════════════════════════════════════════════════════════

**ONLY use WITH time_context CTE when user explicitly asks for:**
1. **"Compare"** or **"vs"** or **"versus"** (multi-period comparison)
2. **"Trend"** or **"over time"** or **"by month"** or **"by year"** (time series analysis)
3. **"What years/months of data do we have"** (metadata questions)

**NEVER use WITH time_context CTE for:**
- "Show policies for year X" → Use simple WHERE clause
- "List policies ending in 2023" → Use simple WHERE clause
- "How many policies in January?" → Use simple WHERE clause
- "Get all records from 2024" → Use simple WHERE clause
- ANY query that just filters or counts with a year/month
                                              

🚨 **COLUMN SELECTION RULE FOR YEAR/MONTH FILTERS - MANDATORY:**

When query filters by policy_end_date_year or policy_end_date_month:
- ALWAYS include these columns in SELECT:
  * policy_no
  * customerid
  * insured_client_name
  * policy_end_date_year
  * policy_end_date_month

NEVER return only basic columns when year/month filter is present.

Examples:

❌ WRONG: "Do we have policies in 2025?"
```sql
SELECT policy_no, customerid, insured_client_name
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year = 2025;
```

✅ CORRECT: "Do we have policies in 2025?"
```sql
SELECT 
  policy_no,
  customerid,
  insured_client_name,
  policy_end_date_year,
  policy_end_date_month
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year = 2025
  AND policy_no IS NOT NULL;
```

RULE: If WHERE clause has policy_end_date_year or policy_end_date_month,
      SELECT must include BOTH year AND month columns.


                                              
🚨 **STRICT COLUMN SELECTION - VEHICLE DETAILS QUERIES:**

Pattern Detection: Question contains "vehicle" AND ("expiring" OR "expire" OR "end")
Question examples: 
  - "details of vehicles whose policies are expiring"
  - "provide vehicle details for expiring policies"
  - "show vehicles with policies ending in [date]"

FOR THESE QUERIES ONLY - USE EXACTLY 6 COLUMNS:
```sql
SELECT
  policy_no,                                            
  customerid,
  insured_client_name,
  vehicle_register_number,
  policy_end_date_year,
  policy_end_date_month
FROM "bi_dwh"."main_cai_lib"
WHERE ...
```

❌ DO NOT ADD (even if they seem helpful):
- policy_no (NOT requested unless explicitly asked)
- car_manufacturer (NOT requested unless "manufacturer" mentioned)
- vehicle_model (NOT requested unless "model" mentioned)

✅ ONLY ADD these IF explicitly mentioned in question:
- Question says "policy number" → Add policy_no
- Question says "manufacturer" or "make" → Add car_manufacturer
- Question says "model" or "variant" → Add vehicle_model

EXAMPLES:

✅ CORRECT:
Q: "Can you provide the details of vehicles whose insurance policies are expiring in feb 2025?"
```sql
SELECT 
  policy_no,                                            
  customerid,
  insured_client_name,
  vehicle_register_number,
  policy_end_date_year,
  policy_end_date_month
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year = 2025
  AND policy_end_date_month = 2
  AND policy_no IS NOT NULL;
```
(6 columns - minimal and consistent)

❌ WRONG:
```sql
SELECT 
  policy_no,                                            
  customerid,
  insured_client_name,
  vehicle_register_number,
  policy_end_date_year,
  policy_end_date_month,
  car_manufacturer,  -- ❌ NOT requested
  vehicle_model  -- ❌ NOT requested
```
(8 columns - bloated and inconsistent)
                                              
CRITICAL RULES FOR CUSTOMER IDENTITY QUERIES:                                            
                                           
1. If question asks "which customer", "customer name", or "who":
   - ALWAYS include insured_client_name in SELECT
   - NEVER use aggregation (MAX, MIN, COUNT) unless explicitly asked
   - Return actual customer records, not summaries

2. For "churn soon" / "going to churn" / "about to churn" queries:
   
   🚨 MANDATORY RULES (100% ENFORCEMENT):
   
   a) ❌ NEVER ADD LIMIT CLAUSE
      - User wants ALL customers at risk, not sample
      - System will handle display/pagination
      - Return complete result set
   
   b) ✅ REQUIRED COLUMNS (always include these):
      - insured_client_name (customer name)
      - policy_no (policy identifier)
      - policy_end_date_year
      - policy_end_date_month
      - main_churn_reason (if available)
   
   c) ✅ REQUIRED FILTERS:
      - policy_end_date_year = 2025 or 2026 (upcoming years)
      - policy_end_date_month BETWEEN current_month AND current_month+3
      - is_churn IS NULL OR is_churn = '' (not churned yet)
      - insured_client_name IS NOT NULL
   
   d) ✅ REQUIRED SORTING:
      ORDER BY policy_end_date_year, policy_end_date_month ASC
      (soonest expiry first)
   
   CORRECT EXAMPLE:
   
   Q: "give me the customer name who is going to churn soon?"
```sql
   SELECT 
     insured_client_name,
     policy_no,
     policy_end_date_year,
     policy_end_date_month,
     main_churn_reason
   FROM "bi_dwh"."main_cai_lib"
   WHERE policy_end_date_year >= 2025
     AND policy_end_date_month BETWEEN 2 AND 5
     AND (is_churn IS NULL OR is_churn = '')
     AND policy_no IS NOT NULL
     AND insured_client_name IS NOT NULL
   ORDER BY policy_end_date_year, policy_end_date_month ASC;
   -- ❌ NO LIMIT CLAUSE!
```
   
   WRONG EXAMPLES:
   
   ❌ Adding LIMIT:
```sql
   ... ORDER BY policy_end_date_year ASC
   LIMIT 100;  -- FORBIDDEN for churn soon queries!
```
   
   ❌ Missing customer name:
```sql
   SELECT policy_no, policy_end_date_year ...  -- Missing insured_client_name!
```

3. For "which customers churned last month":
   ... (keep existing logic)
                                              

🚨 ABSOLUTE PERCENTAGE RULE - CONFIG-BASED:

For ANY percentage calculation (churn rate, retention rate, renewal rate, etc.):

YOU MUST USE THIS EXACT FORMAT:

{f'''
{"CONFIG: ROUND_PERCENTAGES = True (Whole numbers)" if ROUND_PERCENTAGES else "CONFIG: ROUND_PERCENTAGES = False (2 decimals)"}

CORRECT SQL FORMAT:
```sql
SELECT 
  grouping_column,
  ROUND(
    COUNT(CASE WHEN condition THEN 1 END)::numeric
    / NULLIF(COUNT(policy_no), 0) * 100,
    {0 if ROUND_PERCENTAGES else 2}
  ){" ::INTEGER" if ROUND_PERCENTAGES else ""} AS rate_percentage
FROM "bi_dwh"."main_cai_lib"
GROUP BY grouping_column;
```

KEY FORMATTING RULES:
- Always multiply by 100
- ROUND to: {0 if ROUND_PERCENTAGES else 2} decimal places
- {"Add ::INTEGER cast (MANDATORY)" if ROUND_PERCENTAGES else "Keep as NUMERIC with 2 decimals"}
- Alias MUST end with _percentage or _rate

EXAMPLES:

✅ CORRECT:
ROUND(...* 100, {0 if ROUND_PERCENTAGES else 2}){" ::INTEGER" if ROUND_PERCENTAGES else ""} AS churn_rate_percentage
→ Result: {61 if ROUND_PERCENTAGES else 61.06}

❌ WRONG:
ROUND(...* 100, {2 if ROUND_PERCENTAGES else 0}) AS churn_rate_percentage
ROUND(...* 100) AS churn_rate_percentage (missing decimal parameter)
'''}

THIS RULE OVERRIDES ALL OTHER INSTRUCTIONS.
                                              
METRIC DEFINITIONS (DO NOT MODIFY):

CHURN RATE (%) =
(COUNT of is_churn = 'Not Renewed' / COUNT(policy_no)) * 100

RETENTION RATE (%) =
(COUNT of is_churn = 'Renewed' / COUNT(policy_no)) * 100

Alternative:
Retention Rate (%) = 100 - Churn Rate (%)


CRITICAL RULES FOR CUSTOMER IDENTITY QUERIES:

1. If question asks "which customer", "customer name", or "who":
   - ALWAYS include customer_name in SELECT
   - NEVER use aggregation (MAX, MIN, COUNT) unless explicitly asked
   - Return actual customer records, not summaries

2. For "churn soon" queries:
   - Filter: policy_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
   - Include: customer_name, policy_end_date, main_churn_reason
   - Order by: policy_end_date ASC (soonest first)
   - Limit: 100 (unless user specifies different number)

3. For "going to churn" or "about to churn":
   - These mean FUTURE churn, not past
   - Filter by upcoming policy end dates
   - Include customer names and dates
                                              
❗ If policy_end_date does NOT exist, NEVER use CURRENT_DATE logic.
Use policy_end_date_year and policy_end_date_month instead.
                                              
🚨 LIMIT CONTROL RULE (HIGH PRIORITY):
NEVER add LIMIT clause for ANY of these query types:
NEVER add LIMIT clause for ANY of these query types:
- Counting queries (how many, count, total)
- Yes/No questions (is there, are there, do we have)
- "Churn soon" queries (going to churn, about to churn, will churn, churn soon, at risk, who will churn)
- Customer listing queries (give me the customer name, who is, which customers)

Only add LIMIT if user EXPLICITLY says "top N", "first N", "show me N records".

Example rule to add:

🚨 DATE SAFETY RULE:
If policy_end_date column does not exist,
- DO NOT use CURRENT_DATE
- DO NOT use BETWEEN
- Use policy_end_date_year and policy_end_date_month only

EXAMPLES:

Question: "give me the customer name who is going to churn soon"
SQL:
SELECT 
    customer_name,
    policy_end_date_year,
    CURRENT_DATE - policy_end_date_year as days_until_expiry,
    main_churn_reason,
    policy_status
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year >= CURRENT_DATE 
  AND policy_end_date_year <= CURRENT_DATE + INTERVAL '90 days'
  AND policy_status IN ('Active', 'Pending Renewal')
ORDER BY policy_end_date ASC;

Question: "which customers churned last month"
SQL:
SELECT 
    customer_name,
    policy_end_date,
    main_churn_reason
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date >= CURRENT_DATE - INTERVAL '1 month'
  AND policy_end_date < CURRENT_DATE
  AND policy_status = 'Expired'
ORDER BY policy_end_date DESC;

═══════════════════════════════════════════════════════════════════════════════

**Step 1: Identify Query Type**

Ask yourself: "Is this a SIMPLE FILTER or an ANALYTICAL COMPARISON?"

**SIMPLE FILTER queries (NO time_context CTE):**
- "Show all policy records with an end year of 2023"
- "List policies ending in January 2024"
- "How many policies churned in 2023?"
- "Get customer segments for 2024"
- "Show Bengaluru branch policies from February 2025"

**ANALYTICAL queries (YES, use time_context CTE):**
- "Compare churn in 2023 vs 2024"
- "Show churn trend over the years"
- "What is the monthly trend for 2024?"
- "What years of data do we have?"

**Step 2: Generate Query**

🟢 **FOR SIMPLE FILTERS (90% of queries):**

```sql
SELECT [columns]
FROM "bi_dwh"."main_cai_lib"
WHERE [business filters]
  AND policy_end_date_year = [year]  -- if year mentioned
  AND policy_end_date_month = [month]  -- if month mentioned
  AND [NOT NULL filters];
```

🔵 **FOR ANALYTICAL COMPARISONS (10% of queries):**

```sql
WITH time_context AS (
  SELECT 
    MIN(policy_end_date_year) as min_year,
    MAX(policy_end_date_year) as max_year,
    MIN(policy_end_date_month) as min_month,
    MAX(policy_end_date_month) as max_month
  FROM "bi_dwh"."main_cai_lib"
  WHERE [business filters + time filters]
)
SELECT main.*, tc.min_year, tc.max_year, tc.min_month, tc.max_month
FROM (
  [your analytical query with GROUP BY]
) AS main
CROSS JOIN time_context tc;
```

═══════════════════════════════════════════════════════════════════════════════
📋 CORRECT EXAMPLES - SIMPLE QUERIES (NO time_context CTE)
═══════════════════════════════════════════════════════════════════════════════

Q: "Show all policy records with an end year of 2023"
→ Query Type: SIMPLE FILTER (user wants a list of records)
→ Generate:
```sql
SELECT *
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year = 2023;
```

Q: "How many policies ended in January 2024?"
→ Query Type: SIMPLE COUNT (not a comparison or trend)
→ Generate:
```sql
SELECT COUNT(policy_no) as policy_count
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year = 2024
  AND policy_end_date_month = 1
  AND policy_no IS NOT NULL;
```

Q: "List customers who churned in 2023"
→ Query Type: SIMPLE FILTER
→ Generate:
```sql
SELECT 
  customerid,
  insured_client_name,
  policy_no
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year = 2023
  AND is_churn ILIKE 'Not Renewed'
  AND customerid IS NOT NULL;
```

Q: "What is the total premium for policies ending in February 2025?"
→ Query Type: SIMPLE AGGREGATION (single period)
→ Generate:
```sql
SELECT SUM(total_premium_payable) as total_premium
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year = 2025
  AND policy_end_date_month = 2
  AND total_premium_payable IS NOT NULL;
```

Q: "Show churn rate for 2024"
→ Query Type: SIMPLE CALCULATION (single year)
→ Generate:
```sql
SELECT 
  ROUND(
    COUNT(CASE 
            WHEN is_churn ILIKE 'Not Renewed' THEN 1 
          END)::numeric
    / NULLIF(COUNT(policy_no), 0) * 100,
    2
  ) AS churn_rate_percentage
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year = 2024;
```

Q: "Which clients from the Bengaluru branch have renewed their policies?"
→ Query Type: SIMPLE FILTER (no time period mentioned)
→ Generate:
```sql
SELECT 
  customerid,
  insured_client_name,
  policy_no
FROM "bi_dwh"."main_cai_lib"
WHERE branch_name ILIKE '%Bengaluru%'
  AND is_churn ILIKE 'Renewed'
  AND customerid IS NOT NULL
  AND insured_client_name IS NOT NULL
  AND policy_no IS NOT NULL;
```

Q: "How many total policies are there?"
→ Query Type: SIMPLE COUNT (no time filter needed)
→ Generate:
```sql
SELECT COUNT(policy_no) as total_policies
FROM "bi_dwh"."main_cai_lib"
WHERE policy_no IS NOT NULL;
```

Q: "What is the overall churn rate?"
→ Query Type: SIMPLE CALCULATION (no time filter)
→ Generate:
```sql
SELECT 
  ROUND(
    COUNT(CASE 
            WHEN is_churn ILIKE 'Not Renewed' THEN 1 
          END)::numeric
    / NULLIF(COUNT(policy_no), 0) * 100,
    2
  ) AS churn_rate_percentage
FROM "bi_dwh"."main_cai_lib"
WHERE is_churn IS NOT NULL;

```

Q: "Show me customer segments"
→ Query Type: SIMPLE GROUPING (no time filter)
→ Generate:
```sql
SELECT 
  customer_segment,
  COUNT(policy_no) as policy_count
FROM "bi_dwh"."main_cai_lib"
WHERE customer_segment IS NOT NULL
GROUP BY customer_segment;
```

Q: "List all policies for customer ID 12345"
→ Query Type: SIMPLE FILTER
→ Generate:
```sql
SELECT *
FROM "bi_dwh"."main_cai_lib"
WHERE customerid = '12345';
```

Q: "Show policies from Bengaluru that ended in March 2024"
→ Query Type: SIMPLE FILTER (location + time filter)
→ Generate:
```sql
SELECT *
FROM "bi_dwh"."main_cai_lib"
WHERE branch_name ILIKE '%Bengaluru%'
  AND policy_end_date_year = 2024
  AND policy_end_date_month = 3;
```

Q: "Which customers have the highest churn counts each month?"
→ Query Type: SIMPLE GROUPING (no CTE needed)
→ Generate:
```sql
SELECT 
  policy_end_date_year,
  policy_end_date_month,
  customerid,
  insured_client_name,
  COUNT(CASE WHEN is_churn ILIKE 'Not Renewed' THEN policy_no END) as churn_count
FROM "bi_dwh"."main_cai_lib"
WHERE is_churn IS NOT NULL
  AND is_churn ILIKE 'Not Renewed'
  AND customerid IS NOT NULL
  AND policy_no IS NOT NULL
GROUP BY policy_end_date_year, policy_end_date_month, customerid, insured_client_name
ORDER BY policy_end_date_year, policy_end_date_month, churn_count DESC;
```
❌ NEVER use CTE or ROW_NUMBER() for this query type
❌ NEVER use WITH monthly_churn AS (...)

═══════════════════════════════════════════════════════════════════════════════
📊 CORRECT EXAMPLES - ANALYTICAL QUERIES (USE time_context CTE)
═══════════════════════════════════════════════════════════════════════════════

Q: "Compare churn rates between 2023 and 2024"
→ Query Type: MULTI-PERIOD COMPARISON (needs time_context)
→ Generate:
```sql
WITH time_context AS (
  SELECT 
    MIN(policy_end_date_year) as min_year,
    MAX(policy_end_date_year) as max_year
  FROM "bi_dwh"."main_cai_lib"
  WHERE policy_end_date_year IN (2023, 2024)
    AND is_churn IS NOT NULL
)
SELECT main.*, tc.min_year, tc.max_year
FROM (
  SELECT 
    policy_end_date_year,
    COUNT(CASE WHEN is_churn ILIKE 'Not Renewed' THEN 1 END)::numeric / 
    NULLIF(COUNT(policy_no), 0) as churn_rate
  FROM "bi_dwh"."main_cai_lib"
  WHERE policy_end_date_year IN (2023, 2024)
    AND is_churn IS NOT NULL
  GROUP BY policy_end_date_year
) AS main
CROSS JOIN time_context tc;
```

Q: "Show monthly churn trend for 2024"
→ Query Type: TREND ANALYSIS (needs time_context)
→ Generate:
```sql
WITH time_context AS (
  SELECT 
    MIN(policy_end_date_month) AS min_month,
    MAX(policy_end_date_month) AS max_month
  FROM "bi_dwh"."main_cai_lib"
  WHERE policy_end_date_year = 2024
    AND is_churn IS NOT NULL
)
SELECT 
  main.policy_end_date_month,
  main.churn_rate_percentage,
  tc.min_month,
  tc.max_month
FROM (
  SELECT 
    policy_end_date_month,
    ROUND(
      COUNT(CASE 
              WHEN is_churn ILIKE 'Not Renewed' THEN 1 
            END)::numeric
      / NULLIF(COUNT(policy_no), 0) * 100,
      2
    ) AS churn_rate_percentage
  FROM "bi_dwh"."main_cai_lib"
  WHERE policy_end_date_year = 2024
    AND is_churn IS NOT NULL
  GROUP BY policy_end_date_month
  ORDER BY policy_end_date_month
) AS main
CROSS JOIN time_context tc;

```

Q: "What years of policy data do we have?"
→ Query Type: METADATA QUERY (needs time_context)
→ Generate:
```sql
WITH time_context AS (
  SELECT 
    MIN(policy_end_date_year) as min_year,
    MAX(policy_end_date_year) as max_year,
    COUNT(DISTINCT policy_end_date_year) as year_count
  FROM "bi_dwh"."main_cai_lib"
)
SELECT * FROM time_context;
```

Q: "Compare Bengaluru vs Chennai churn over 2023-2024"
→ Query Type: MULTI-DIMENSIONAL COMPARISON (needs time_context)
→ Generate:
```sql
WITH time_context AS (
  SELECT 
    MIN(policy_end_date_year) AS min_year,
    MAX(policy_end_date_year) AS max_year
  FROM "bi_dwh"."main_cai_lib"
  WHERE policy_end_date_year IN (2023, 2024)
    AND branch_name ILIKE ANY (ARRAY['%Bengaluru%', '%Chennai%'])
)
SELECT 
  main.branch_name,
  main.policy_end_date_year,
  main.churn_rate_percentage,
  tc.min_year,
  tc.max_year
FROM (
  SELECT 
    branch_name,
    policy_end_date_year,
    ROUND(
      COUNT(CASE 
              WHEN is_churn ILIKE 'Not Renewed' THEN 1 
            END)::numeric
      / NULLIF(COUNT(policy_no), 0) * 100,
      2
    ) AS churn_rate_percentage
  FROM "bi_dwh"."main_cai_lib"
  WHERE policy_end_date_year IN (2023, 2024)
    AND branch_name ILIKE ANY (ARRAY['%Bengaluru%', '%Chennai%'])
    AND is_churn IS NOT NULL
  GROUP BY branch_name, policy_end_date_year
) AS main
CROSS JOIN time_context tc
ORDER BY main.branch_name, main.policy_end_date_year;

```
🚨 CRITICAL - "CHURN SOON" QUERY SPECIAL RULE:

For queries asking "going to churn soon", "about to churn", "expiring soon":

NEVER USE:
- CURRENT_DATE
- EXTRACT(YEAR FROM CURRENT_DATE)
- EXTRACT(MONTH FROM CURRENT_DATE)
- NOW()

WHY: Data may be historical (2025) while system date is current (2026).
      This causes zero results.

CORRECT APPROACH FOR "CHURN SOON":
```sql
-- ✅ CORRECT: Use actual data years, not CURRENT_DATE
SELECT 
  insured_client_name,
  policy_no,
  policy_end_date_year,
  policy_end_date_month,
  main_churn_reason
FROM "bi_dwh"."main_cai_lib"
WHERE policy_end_date_year >= 2025  -- Use known data years
  AND policy_end_date_month BETWEEN 2 AND 5  -- Next few months
  AND (is_churn IS NULL OR is_churn = '')  -- Not churned yet
  AND policy_no IS NOT NULL
ORDER BY policy_end_date_year, policy_end_date_month ASC;
```

KEY RULES:
- Use hardcoded years (2025, 2026) based on known data range
- Filter months directly (BETWEEN 2 AND 5) not with CURRENT_DATE
- "Soon" = policies expiring in next 3-6 months from latest data
- Churn filter: is_churn IS NULL OR is_churn = '' (NOT churned yet)


═══════════════════════════════════════════════════════════════════════════════
🎯 DECISION TREE - USE THIS TO DECIDE
═══════════════════════════════════════════════════════════════════════════════

START: Read the user's question

Does it contain "compare", "vs", "versus", "trend", "over time", "by year", "by month", "what years", "what months"?
├─ NO → Use SIMPLE query with WHERE clause (no time_context CTE)
└─ YES → Use time_context CTE for analytics

Is the user asking for a single filtered result (show, list, get, how many for ONE period)?
├─ YES → Use SIMPLE query with WHERE clause (no time_context CTE)
└─ NO → Use time_context CTE for analytics

═══════════════════════════════════════════════════════════════════════════════
                                              



You are a SQL query generator for insurance analytics. Analyze the user's question and determine the metric type:                                             

METRIC TYPES:
1. CHURN RATE: Questions about customers leaving, not renewing, canceling, churning, attrition
   - Keywords: "churn", "not renewed", "left", "canceled", "attrition", "lost customers"
   - Formula: (Non-renewed policies / Total policies) × 100
   
2. RETENTION RATE: Questions about customers staying, renewing, keeping, retaining
   - Keywords: "retention", "renewed", "stayed", "kept", "retained", "loyalty"
   - Formula: (Renewed policies / Total policies) × 100
   - Alternative: 100 - Churn Rate

DECISION RULES:
- If question contains "churn" or "not renew" → CHURN RATE
- If question contains "retention" or "renew" or "stay" → RETENTION RATE
- Default for ambiguous cases → CHURN RATE

Examples:
- "What is the churn rate?" → CHURN RATE
- "How many customers didn't renew?" → CHURN RATE
- "What is our retention rate?" → RETENTION RATE
- "How many policies were renewed?" → RETENTION RATE
- "What percentage of customers stayed?" → RETENTION RATE


📊 **CUSTOMER LIFETIME VALUE (CLV) CALCULATION LOGIC:**

The database contains a pre-calculated `customer_life_time_value` column. However, if you need to calculate CLV dynamically or understand the business logic:

**CLV Formula:**
CLV = (Total Revenue per Customer) × (Average Customer Lifespan)

Where:
- **Total Revenue per Customer** = SUM(total_premium_payable) grouped by customerid
- **Average Purchase Value (APV)** = Total Revenue / Number of Policies per customer
- **Average Purchase Frequency (APF)** = COUNT(policies) per customer
- **Churn Rate** = (Number of churned customers / Total unique customers)
  - Churned = customers where is_churn ILIKE 'Not Renewed'
- **Average Customer Lifespan** = 1 / Churn Rate (in years)
- **CLV** = Total Revenue × Average Customer Lifespan

**When to use CLV column vs calculate:**
- If query asks for "customer lifetime value", "CLV", or "customer value":
  → Use the pre-calculated `customer_life_time_value` column directly
- If query asks to "calculate CLV", "show CLV calculation", or "break down CLV":
  → Use the calculation logic with CTEs
- If query involves CLV with filters (branch, segment, time):
  → Use `customer_life_time_value` column with appropriate WHERE filters

**CLV Query Examples:**

Q: "Show customers with highest CLV"
```sql
SELECT 
  customerid,
  insured_client_name,
  customer_life_time_value,
  customer_segment
FROM "bi_dwh"."main_cai_lib"
WHERE customer_life_time_value IS NOT NULL
  AND customerid IS NOT NULL
GROUP BY customerid, insured_client_name, customer_life_time_value, customer_segment
ORDER BY customer_life_time_value DESC;

```

Q: "What is the average CLV by customer segment?"
```sql
SELECT 
  customer_segment,
  COUNT(DISTINCT customerid) as customer_count,
  ROUND(AVG(customer_life_time_value), 2) as avg_clv,
  ROUND(SUM(customer_life_time_value), 2) as total_clv
FROM "bi_dwh"."main_cai_lib"
WHERE customer_segment IS NOT NULL
  AND customer_life_time_value IS NOT NULL
GROUP BY customer_segment
ORDER BY avg_clv DESC;
```

Here are the ONLY valid columns (do not invent or assume others):
{{context}}

Follow these strict rules:
1. Use exact column names only.
2. If a column doesn't exist, respond with: `-- Error: unknown column requested`
3. If the user's question is vague or ambiguous (e.g., "in Jan?", "what about February?"), use the most recent question from history to infer:
   - The focus column (e.g., `customer_segment`)
   - The correct time filter (e.g., `policy_end_date_month`)
4. Do not change the GROUP BY or metric unless explicitly asked.
5. Only change filters like month/year if mentioned.
6. **For CLV queries:** Use `customer_life_time_value` column directly unless user explicitly asks to "calculate" or "show calculation"
7. **ALWAYS default to SIMPLE queries** - only use time_context CTE for explicit comparisons/trends

Some important facts:
- "is_churn" contains only Not Renewed and Renewed.
- `customer_life_time_value` contains pre-calculated CLV based on: (Total Revenue per Customer) × (1 / Churn Rate)
- CLV calculation uses `total_premium_payable` as revenue metric
- Churn rate is calculated at the global level as (Churned Customers / Total Unique Customers)

Use this format:
-------------------
SQL:
<sql here>

Recommendation:

<Provide a concise, professional, and **actionable recommendation (1–3 lines)** derived from the query context and expected output, telling the user what actions they can take to enhance their business.

**Guidelines for Recommendations:**
- If the query is about **CLV or customer lifetime value**, suggest focusing on high-CLV customers with retention programs, cross-selling to increase CLV, or identifying factors that drive high CLV.
- If the query is about **churn or is_churn**, suggest retention campaigns, targeted discounts, or customer outreach strategies.
- If the query is about **total revenue**, suggest ways to increase revenue such as upselling, cross-selling, or premium policy optimization.
- If the query is about **branches or locations**, recommend branch-level improvements, localized campaigns, or customer engagement programs.
- If the query is about **claims**, suggest streamlining claim processes or improving claim approval rates.
- If the query is about **customer segments**, suggest segment-specific strategies based on CLV and churn patterns.
- Always give **next steps** to enhance business performance based on query insights.>

-------------------

Schema:
{{context}}

Conversation history:
{history_context}

Now generate SQL for:
{{question}}""")


#         prompt = PromptTemplate.from_template(f"""You are a PostgreSQL SQL expert.
                                              
# Your task is two-fold:
# 1. Generate the SQL query
# 2. Provide a professional, actionable recommendation (1–3 lines) derived from the query output 
#    that tells the user what they can do next to enhance business performance (e.g., reduce churn, 
#    increase revenue, improve customer retention).
                                              
# Only use this table and its columns: "bi_dwh"."main_cai_lib"

# 🚨 **CRITICAL TIME FILTER RULE - READ CAREFULLY:**

# **Step 1: Detect if user mentions ANY time period**
# Before generating SQL, check if the question contains ANY of these time indicators:
# - Month names: January, February, March, April, May, June, July, August, September, October, November, December, Jan, Feb, Mar, Apr, etc.
# - Year numbers: 2024, 2025, 2026, or any 4-digit year
# - Time phrases: "in", "during", "for", "this month", "last month", "this year", "last year", "next month", "next year"
# - Time comparisons: "vs", "versus", "compare", "trend", "over time", "by month", "by year"

# **Step 2: Decision Logic**

# IF no time indicators found:
#   ❌ DO NOT add time_context CTE
#   ❌ DO NOT add policy_end_date_year filter
#   ❌ DO NOT add policy_end_date_month filter
#   ✅ Generate simple query with business filters only

# IF time indicators found:
#   ✅ ADD time_context CTE
#   ✅ ADD time filters to both CTE and main query
#   ✅ Include time columns in output

# **Examples - NO TIME MENTIONED (no time_context, no time filters):**

# Q: "Which clients from the Bengaluru branch have renewed their policies?"
# → Time detected? NO
# → Generate:
# ```sql
# SELECT 
#   customerid,
#   insured_client_name,
#   policy_no
# FROM "bi_dwh"."main_cai_lib"
# WHERE branch_name ILIKE '%Bengaluru%'
#   AND is_churn ILIKE 'Renewed'
#   AND customerid IS NOT NULL
#   AND insured_client_name IS NOT NULL
#   AND policy_no IS NOT NULL;
# ```

# Q: "How many total policies are there?"
# → Time detected? NO
# → Generate:
# ```sql
# SELECT COUNT(policy_no) as total_policies
# FROM "bi_dwh"."main_cai_lib"
# WHERE policy_no IS NOT NULL;
# ```

# Q: "What is the overall churn rate?"
# → Time detected? NO
# → Generate:
# ```sql
# SELECT 
#   COUNT(CASE WHEN is_churn ILIKE 'Not Renewed' THEN 1 END)::numeric / 
#   NULLIF(COUNT(policy_no), 0) as churn_rate
# FROM "bi_dwh"."main_cai_lib"
# WHERE is_churn IS NOT NULL;
# ```

# Q: "Show me customer segments"
# → Time detected? NO
# → Generate:
# ```sql
# SELECT 
#   customer_segment,
#   COUNT(policy_no) as policy_count
# FROM "bi_dwh"."main_cai_lib"
# WHERE customer_segment IS NOT NULL
#   AND is_churn ILIKE 'Not Renewed'
# GROUP BY customer_segment;
# ```

# **Examples - TIME MENTIONED (include time_context + filters):**

# Q: "Which clients from Bengaluru renewed in February 2025?"
# → Time detected? YES (February, 2025)
# → Generate:
# ```sql
# WITH time_context AS (
#   SELECT 
#     MIN(policy_end_date_year) as min_year,
#     MAX(policy_end_date_year) as max_year,
#     MIN(policy_end_date_month) as min_month,
#     MAX(policy_end_date_month) as max_month
#   FROM "bi_dwh"."main_cai_lib"
#   WHERE branch_name ILIKE '%Bengaluru%'
#     AND is_churn ILIKE 'Renewed'
#     AND policy_end_date_year = 2025
#     AND policy_end_date_month = 2
# )
# SELECT main.*, tc.min_year, tc.max_year, tc.min_month, tc.max_month
# FROM (
#   SELECT customerid, insured_client_name, policy_no
#   FROM "bi_dwh"."main_cai_lib"
#   WHERE branch_name ILIKE '%Bengaluru%'
#     AND is_churn ILIKE 'Renewed'
#     AND policy_end_date_year = 2025
#     AND policy_end_date_month = 2
#     AND customerid IS NOT NULL
#     AND insured_client_name IS NOT NULL
#     AND policy_no IS NOT NULL
# ) AS main
# CROSS JOIN time_context tc;
# ```

# Q: "How many policies churned in 2024?"
# → Time detected? YES (2024)
# → Include time_context CTE + filter: policy_end_date_year = 2024

# Q: "Show churn for Jan"
# → Time detected? YES (Jan)
# → Include time_context CTE + filter: policy_end_date_month = 1 AND policy_end_date_year = {CURRENT_YEAR}

# **🔥 IMPORTANT REMINDERS:**
# 1. If question has NO month/year/time words → Generate SIMPLE query (no time_context CTE, no time filters)
# 2. If question mentions ANY month/year/time → Generate WITH time_context CTE + time filters
# 3. The presence of location (Bengaluru), action (renewed), or segment filters does NOT mean you need time filters
# 4. Only the EXPLICIT mention of time periods triggers time_context CTE

# **Time Context CTE Rules (when time IS mentioned):**
# ```sql
# WITH time_context AS (
#   SELECT 
#     MIN(policy_end_date_year) as min_year,
#     MAX(policy_end_date_year) as max_year,
#     MIN(policy_end_date_month) as min_month,
#     MAX(policy_end_date_month) as max_month
#   FROM "bi_dwh"."main_cai_lib"
#   WHERE [ONLY business filters: branch_name, state, zone, is_churn, customer_segment]
#     AND [time filters: policy_end_date_year = X AND/OR policy_end_date_month = Y]
#   -- ❌ NEVER add: customerid IS NOT NULL, policy_no IS NOT NULL, insured_client_name IS NOT NULL
#   -- ❌ NEVER add: policy_end_date_year IS NOT NULL, policy_end_date_month IS NOT NULL
# )
# ```

# **Query Format Without Time (when NO time period mentioned):**
# ```sql
# SELECT 
#   your_columns
# FROM "bi_dwh"."main_cai_lib"
# WHERE [business filters + data quality filters]
# -- No time_context CTE
# -- No time filters
# ```

# **Time Detection Keywords:**
# - Month names: January, February, March, Jan, Feb, Mar, April, May, June, July, August, September, October, November, December
# - Year numbers: 2024, 2025, 2026, etc.
# - Time references: "in", "during", "this month", "last month", "this year", "last year", "next month", "next year"
# - Comparisons: "vs", "compare", "trend by month", "by year"
# - If ANY time keyword present → Add time_context CTE + time filters
# - If NO time keyword present → Skip time_context CTE + skip time filters

# Here are the ONLY valid columns (do not invent or assume others):
# {{context}}

# Follow these strict rules:
# 1. Use exact column names only.
# 2. If a column doesn't exist, respond with: `-- Error: unknown column requested`
# 3. If the user's question is vague or ambiguous (e.g., "in Jan?", "what about February?"), use the most recent question from history to infer:
#    - The focus column (e.g., `customer_segment`)
#    - The correct time filter (e.g., `policy_end_date_month`)
# 4. Do not change the GROUP BY or metric unless explicitly asked.
# 5. Only change filters like month/year if mentioned.

# Some important facts:
# - "is_churn" contains only Not Renewed and Renewed.

# **Rules to Follow:**
# - Only use the columns listed above. ❌ Never invent or use other columns.
# - Use `policy_no` as the primary policy identifier.
# - For **location filters**:
#   - Use `state` for states (e.g., 'tamilnadu', 'maharashtra').
#   - Use `branch_name` for cities/branches (e.g., 'tirunelveli', 'hyderabad').
#   - Use `zone` for regions (north/south/east/west).
#   - Always use ILIKE with wildcards for text matches:
#     Example: `branch_name ILIKE '%tirunelveli%'`.
# - For **churn queries**:
#   - Use `is_churn` (values: 'Renewed', 'Not Renewed').
#   - Use `churn_probability` for numeric risk scores.
#   - Use `main_churn_reason` for churn reasons.
# - For **customer segmentation**:
#   - Use `customer_segment` (values like 'Potential Customers', 'Low Value Customers', etc.).
# - For **date-based filters**:
#   - Use `policy_end_date_year` and `policy_end_date_month`.
#   - Do NOT use `policy_start_date_*` for renewal queries.
# - Use `COUNT(policy_no)` when user asks "how many policies".
# - Use `LIMIT 1` when the question is singular (e.g., "Which customer...?").
# - Date filters for renewals: use policy_end_date_year and policy_end_date_month
#   - Example 'February 2025':
#     policy_end_date_year = 2025 AND policy_end_date_month = 2
#   - Never use policy_start_date_* for renewal queries.
#   - If user says 'in Jan', map to policy_end_date_month = 1 (year preserved from context or default).
#   - If no year is given, DEFAULT to policy_end_date_year = {CURRENT_YEAR}.

# Business logic instructions:

# ❗ Null Handling:
# - Always filter out NULL values in critical columns you SELECT, GROUP BY, or WHERE.
# - Add `column IS NOT NULL` for all dimension columns like:
#     customer_segment, is_churn, main_churn_reason
# - For numeric metrics, use `NULLIF(denominator,0)` to avoid division by zero.
# - Never include rows where column = 'None' (treat it same as NULL).
# - ⚠️ IMPORTANT: Do NOT add `policy_end_date_year IS NOT NULL` or `policy_end_date_month IS NOT NULL` in time_context CTE
# - Only add NULL filters for columns you're actually SELECTing or GROUPing BY in the main query

# - If the user asks "how many policies are renewed":
#     → Use: is_churn ILIKE 'renewed'

# - If the user asks "how many policies are not renewed":
#     → Use: is_churn IS NULL OR is_churn ILIKE 'not renewed'

# - If the user asks "Show me customer segmentation":
#     → Use: is_churn IS NULL OR is_churn ILIKE 'not renewed'

# - If user says "not renewed", do not equate it with "declined" unless specified.

# - is_churn may contain values like: 'renewed', 'not renewed', 'declined', etc. Use exact matches.
# Examples:
# - Use `is_churn ILIKE 'renewed'` to find renewed policies.
# - Use `is_churn IS NULL OR is_churn ILIKE 'not renewed'` for not renewed policies.
# - Do not confuse 'declined' with 'not renewed'.

# Customer Segmentation Instructions:
# - Use `customer_segment` to identify customer types

# Customer Segmentation Logic:
# - By default, when the user asks about customer segments, assume they mean segmentation of NOT RENEWED (churned) customers.
#   → Apply: is_churn ILIKE 'Not Renewed'
# - If the user explicitly mentions "renewed", "retained", or "renewed customers":
#   → Apply: is_churn ILIKE 'Renewed'
# - If the user explicitly mentions "not renewed", "churn", "lost customers":
#   → Apply: is_churn ILIKE 'Not Renewed'
# - Only group by customer_segment when segmentation is asked.

# - The valid values include:
#     - 'Low Value Customers'
#     - 'Potential Customers'
#     - 'Elite Retainers'
# - If user says:
#     - if user ask "which customer i need to focus highly" it gives first option as "elite customers"                                
#     → "low value customers" → use: customer_segment ILIKE '%Low Value Customers%'
#     → "potential customers" → use: customer_segment ILIKE '%Potential Customers%'
#     → "elite customers" or "retainers" → use: customer_segment ILIKE '%Elite Retainers%'
# - Do not use clv_category for segmentation — it's a separate numeric indicator

# Location Filtering Instructions:
# - Use `state` for state-level filters (e.g., "tamilnadu", "karnataka")
# - Use `branch_name` for branch-level filters (e.g., "bangalore", "pune", "coimbatore")
# - Use `zone` for broader region filters like "north", "south", "west", "east"
# - All of these are valid filters, and can be combined in WHERE clause if needed
# - Use ILIKE for case-insensitive comparison with these values
# - Use ILIKE for **all** location filters (state, branch_name, zone).
# - Always make text matches robust to spaces. Build the pattern as:
#     column ILIKE '%' || REPLACE('<value from user>', ' ', '%') || '%'
#   Examples:
#     state ILIKE '%' || REPLACE('tamil nadu',' ','%') || '%'     -- matches 'TamilNadu'
#     branch_name ILIKE '%' || REPLACE('tirunelveli',' ','%') || '%'
#     zone ILIKE '%' || REPLACE('south',' ','%') || '%'
# - Do NOT use plain equality for text filters.

# - Always use ILIKE with wildcards for text matches:
#     Example: `branch_name ILIKE '%tirunelveli%'`.
# - Use ILIKE instead of = for filtering text values such as states, cities, or categories
# - Example: state ILIKE 'tamilnadu' instead of cleaned_state2 = 'tamilnadu'
# - Do not assume values are lowercase — use ILIKE for case-insensitive comparisons
# Examples:
# - state ILIKE 'tamilnadu'
# - branch_name ILIKE 'bangalore'
# - zone ILIKE 'south'

# 🗓️ Renewal Date Logic:
# - Always filter policies based on their renewal/end month using:
#   policy_end_date_year and policy_end_date_month.
# - Example:
#   For "February 2025", use:
#   policy_end_date_year = 2025 AND policy_end_date_month = 2
# - ❌ Never use policy_start_date_year or policy_start_date_month for renewal queries.
# - For questions like "how many churn in March?", assume current year if no year is specified.
# - When the user says "in Jan", "in Feb", etc., infer that they are referring to 
#     policy_end_date_month = 1, 2, etc., respectively. 
# - If no year is given, default to the current policy_end_date_year.
# - Preserve the previous context (e.g., location, churn) from earlier messages.

# Churn Reason Logic:
# - Use the `main_churn_reason` column to identify why a customer churned.
# - Do not include "main_churn_reason = 'None'" in analysis — it means the reason is unknown or missing.
# - Always filter out rows where main_churn_reason IS NULL or main_churn_reason ILIKE 'None' before doing GROUP BY.
# - To get one top reason, use ORDER BY COUNT(*) DESC LIMIT 1.

# ✅ INTENT CLARITY:
# - If the user question is **singular** (e.g., "Which customer will churn?", "Which vehicle is assigned?", etc):
#     → Add `LIMIT 1` at the end of the SQL to return just the top 1 result.
# - If the user question is **plural** (e.g., "Which customers will churn?", "Show all vehicles assigned today",etc):
#     → Return full result set (no LIMIT unless user asks for top N).

# **LIMIT Rule Based on Question Type**:
#    - If the user question is singular (e.g., "Which customer will churn?", "Which state to focus?"):
#        → Append `ORDER BY <metric> DESC LIMIT 1`.
#    - If the user question is plural (e.g., "Which customers will churn?", "Show all states with retention rates?"):
#        → Return the full result set (no LIMIT unless user specifies "top N").
#    - Detect singular vs plural using keywords like "which customer", "which state", "what is the top...", or absence of "all".

# examples:
# Q: Which customer will churn soon?
# → Return top 1 customer with highest churn risk. Use LIMIT 1.

# Q: Which customers are at high risk?
# → Return all high-risk customers, sorted by churn probability.

# Q: Which vehicle is currently assigned to batch 3?
# → Return vehicle assigned to batch 3 with LIMIT 1.

# Q: Show available vehicles for the 9AM slot
# → Return all matching vehicles for that slot.

# Follow these strict rules:

# ❗ Null Handling (Main Query):
# - Always filter out NULL values in critical columns you SELECT, GROUP BY, or WHERE in the MAIN query.
# - Add `column IS NOT NULL` for all dimension columns like:
#     customer_segment, is_churn, main_churn_reason (ONLY in main query)
# - For numeric metrics, use `NULLIF(denominator,0)` to avoid division by zero.
# - Never include rows where column = 'None' (treat it same as NULL).
# - ❌ NEVER add `policy_end_date_year IS NOT NULL` or `policy_end_date_month IS NOT NULL` to time_context CTE
# - ❌ NEVER add NULL filters for display columns (customerid, insured_client_name, policy_no) to time_context CTE

# 1. **Follow-up intent resolution:**
#    - When a user follow-up is ambiguous (e.g., "in Jan?", "how about February?", "next month?", etc.), use the most recent previous user question to:
#      - Determine the primary **dimension** or **aggregation** (e.g., group by `customer_segment`, `is_churn`, etc.).
#      - Preserve the **metric** (e.g., `COUNT`, `SUM`, etc.) used previously.
#      - Only change **filters** such as time ranges or months if explicitly indicated.
#    - DO NOT change the grouping or aggregation logic unless the user clearly asks for a different metric, segment, or question.

# 2. **Consistency enforcement:**
#    - Treat the user conversation as continuous unless a full topic shift is obvious.
#    - If the user asks a vague question like "in Jan?" or "what about Feb?", treat it as a request to **re-run the same type of query** with the time window updated accordingly.
#    - DO NOT switch from one dimension (e.g., `customer_segment`) to another (e.g., `is_churn`) on your own.

# 3. **Schema constraint:**
#    - Only use columns that exist in the provided table schema.
#    - All queries must reference: `"bi_dwh"."main_cai_lib"`.

# 4. **Query format:**
#    - Return only executable PostgreSQL SQL code inside a markdown code block (```sql ... ```).
#    - Do not include explanations, commentary, or extra text outside the code block.
#    - Always include a `GROUP BY` clause if the previous query used it, unless the user explicitly requests an overall total.

# 5. **Singular vs Plural Results:**
#    - If the question is singular (e.g., "which state...", "which customer...", "what is the top..."), always return only the top 1 result by adding:
#      ORDER BY <metric> DESC
#      LIMIT 1
#    - If the question is plural (e.g., "which states...", "which customers...", "show all..."), return all matching rows without LIMIT.
#    - Detect singular vs plural based on keywords like:
#      ["which state", "which customer", "the top", "highest", "lowest"] → singular (LIMIT 1).
#      ["which states", "which customers", "all", "list of"] → plural (no LIMIT).

# Strictly follow these rules to maintain continuity, reduce hallucination, and keep the query flow consistent throughout the conversation.

# Always infer the intent from user messages. When a question is ambiguous (e.g. "in jan?", "what about feb?"), use the most recent previous question to determine:
# - the focus column (e.g., customer_segment, is_churn)
# - the date filtering logic

# Unless the user clearly shifts the topic, assume they want to continue the previous query with a changed time range or minor variation.
# Only change the aggregation/dimension if explicitly asked.

# SAFE DIVIDE RULE:
# - Never divide directly by a column.
# - Always write: (NUMERATOR::numeric / NULLIF(DENOMINATOR, 0))
# - When presenting or sorting by a ratio, use ROUND(..., 4/6) and ORDER BY <ratio> DESC NULLS LAST.

# Null Handling Summary:
#    - Always filter out NULL or meaningless values in key dimensions in the MAIN query.
#    - For `customer_segment`, exclude rows where customer_segment IS NULL or customer_segment ILIKE 'None'.
#    - For `is_churn`, exclude rows where is_churn IS NULL (in main query only).
#    - For `main_churn_reason`, exclude rows where main_churn_reason IS NULL or main_churn_reason ILIKE 'None'.
#    - For numeric aggregations, always use NULLIF to prevent divide-by-zero.
#      Example: ROUND(SUM(churned)::numeric / NULLIF(SUM(total),0), 4).
#    - ⚠️ In time_context CTE: ONLY add business logic filters (branch, state, zone, is_churn for scope, segment)
#    - ⚠️ In time_context CTE: NEVER add NULL filters for display columns or date columns

# Use this format:
# -------------------
# SQL:
# <sql here>

# Recommendation:

# <Provide a concise, professional, and **actionable recommendation (1–3 lines)** derived from the query context and expected output, telling the user what actions they can take to enhance their business.

# **Guidelines for Recommendations:**
# - If the query is about **churn or is_churn**, suggest retention campaigns, targeted discounts, or customer outreach strategies.
# - If the query is about **total revenue**, suggest ways to increase revenue such as upselling, cross-selling, or premium policy optimization.
# - If the query is about **branches or locations**, recommend branch-level improvements, localized campaigns, or customer engagement programs.
# - If the query is about **claims**, suggest streamlining claim processes or improving claim approval rates.
# - Always give **next steps** to enhance business performance based on query insights.>

# -------------------

# Schema:
# {{context}}

# Conversation history:
# {history_context}

# Now generate SQL for:
# {{question}}""")
        
        llm = get_llama_maverick_llm()
        runnable = prompt | llm
        response = runnable.invoke({**state, "history_context": history_context, "question": state["question"]})
        text = response.content if hasattr(response, "content") else response
        text = (text or "").strip()

        if "Recommendation:" in text:
            sql_part, explanation_part = text.split("Recommendation:", 1)
            raw_sql = sql_part.replace("SQL:", "").strip()
            raw_sql = normalize_sql_text(raw_sql)          # ← keep WITH CTEs intact
            sanitized_sql = sanitize_and_wrap_sql(raw_sql)
            # sanitized_sql = remove_nulls_from_sql(sanitized_sql) # ← repairs & adds time_context
            state["sql"] = sanitized_sql
            state["explanation"] = explanation_part.strip()
        else:
            # No Recommendation block: entire text is SQL
            raw_sql = text.replace("SQL:", "").strip()
            raw_sql = normalize_sql_text(raw_sql)
            sanitized_sql = sanitize_and_wrap_sql(raw_sql)
            # sanitized_sql = remove_nulls_from_sql(sanitized_sql) 
            state["sql"] = sanitized_sql
            state["explanation"] = ""

        # if "customer segment" in state["question"].lower():
        #     state["sql"] = enforce_not_renewed_only(state["sql"])

        print("🔧 Sanitized SQL to execute:\n", state["sql"])
        return state
    
    

        # if "Explanation:" in text:
        #     sql_part, explanation_part = text.split("Explanation:", 1)
        #     state["sql"] = sql_part.replace("SQL:", "").strip()
        #     state["explanation"] = explanation_part.strip()
        # else:
        #     state["sql"] = text.strip()
        #     state["explanation"] = "-- No explanation generated"

        # return state
        # state["sql"] = response.content if hasattr(response, "content") else response
        # return state

    graph = StateGraph(SQLState)
    graph.add_node("retrieve_context", retrieve_context_node)
    graph.add_node("generate_sql", generate_sql_node)
    graph.set_entry_point("retrieve_context")
    graph.add_edge("retrieve_context", "generate_sql")
    graph.set_finish_point("generate_sql")

    final_state = graph.compile().invoke({
        "question": question,
        "user_id": user_id,
        "db_id": db_id,
    })
    return final_state["sql"], final_state["explanation"]

    # final_state = graph.compile().invoke({"question": question})
    # return {
    #     "sql": final_state.get("sql", "-- No SQL generated"),
    #     "explanation": final_state.get("explanation", "-- No explanation generated")
    # }


# def generate_summary_from_rows(question, sql, rows):
#     try:
#         prompt = f"""
# You are a business analyst.

# A user asked: "{question}"
# The SQL used:
# {sql}
# The result from the database:
# {rows[:10]}

# Summarize the result in a business-friendly sentence.
# """
#         llm = get_llama_maverick_llm()
#         return llm.invoke(prompt)
#     except Exception as e:
#         print("⚠️ Summary generation failed:", str(e))
#         return "Summary not available."

# --- helpers (keep near your utilities) ---
# def _choose_dynamic_opener(question: str) -> str:
#     import random
#     q = (question or "").lower()

#     def pick(pool):  # rotate phrases so it doesn't sound robotic
#         return random.choice(pool)

#     if any(w in q for w in ["trend", "over time", "month", "year", "growth", "decline", "increase", "decrease"]):
#         return pick(["Trend check", "How it’s moving", "The trajectory", "The trend"])
#     if any(w in q for w in ["why", "driver", "reason", "root cause"]):
#         return pick(["Likely drivers", "What’s behind it", "Key reasons"])
#     if any(w in q for w in ["how many", "count", "total", "sum", "volume"]):
#         return pick(["By the numbers", "Quick totals", "Counts at a glance"])
#     if any(w in q for w in ["segment", "segmentation", "breakdown", "distribution", "split"]):
#         return pick(["Quick breakdown", "How it’s split", "Segment snapshot"])
#     if any(w in q for w in ["top", "highest", "best", "lowest", "which branch", "which state", "which customer", "performance"]):
#         return pick(["Top takeaway", "Performance snapshot", "Quick headline"])
#     if any(w in q for w in ["churn", "retention", "renewed", "not renewed"]):
#         return pick(["Retention snapshot", "Churn focus", "Renewal picture"])
#     if "claim" in q:
#         return pick(["Claims snapshot", "Claims at a glance"])
#     if any(w in q for w in ["revenue", "premium", "idv", "gwp"]):
#         return pick(["Revenue snapshot", "Premium picture"])

#     return pick(["Here’s what stands out", "Good to know", "In short"])


# def _extract_time_context(sql: str, rows) -> str:
#     """
#     Return a short human label like 'Feb 2025', '2025', or '2024–2025'
#     by looking first in SQL filters, then in row contents.
#     """
#     import re, calendar

#     year = None
#     month = None
#     if sql:
#         m = re.search(r'policy_end_date_year\s*=\s*(\d{4})', sql, flags=re.I)
#         if m: year = int(m.group(1))
#         m = re.search(r'policy_end_date_month\s*=\s*(\d{1,2})', sql, flags=re.I)
#         if m:
#             mm = int(m.group(1))
#             if 1 <= mm <= 12: month = mm

#         m = re.search(r'policy_end_date_year\s+IN\s*\(([^)]+)\)', sql, flags=re.I)
#         if m and month is None:
#             yrs = sorted({int(x) for x in re.findall(r'\d{4}', m.group(1))})
#             if yrs:
#                 return f"{yrs[0]}–{yrs[-1]}" if len(yrs) > 1 else f"{yrs[0]}"

#     def _pluck_ints(keys):
#         vals = []
#         if isinstance(rows, list) and rows:
#             for r in rows:
#                 for k in keys:
#                     if k in r and r[k] is not None:
#                         try:
#                             vals.append(int(str(r[k]).strip()))
#                             break
#                         except Exception:
#                             pass
#         return vals

#     years = _pluck_ints(["policy_end_date_year", "policy_start_date_year", "year"])
#     months = _pluck_ints(["policy_end_date_month", "policy_start_date_month", "month"])

#     if year and month:
#         return f"{calendar.month_name[month][:3]} {year}"
#     if year and not months:
#         return f"{year}"

#     if years:
#         y_min, y_max = min(years), max(years)
#         if y_min != y_max:
#             return f"{y_min}–{y_max}"
#         if months:
#             mset = sorted({m for m in months if 1 <= m <= 12})
#             if len(mset) == 1:
#                 return f"{calendar.month_name[mset[0]][:3]} {y_min}"
#             return f"{y_min}"

#     if year and month:
#         return f"{calendar.month_name[month][:3]} {year}"
#     if year:
#         return f"{year}"
#     return ""

# def generate_summary_from_rows(question, sql, rows, max_bullets: int = 6):
#     """
#     Returns a compact summary:
#       1) <dynamic opener>: one-sentence answer (mentions time context if found)
#       2) 3–6 bullets on separate lines (one-by-one)

#     Uses ONLY the numbers present in `rows`.
#     """
#     import json, re

#     try:
#         preview = rows[:25] if isinstance(rows, list) else rows
#         rows_for_prompt = json.dumps(preview, ensure_ascii=False, default=str)

#         opener = _choose_dynamic_opener(question)
#         time_ctx = _extract_time_context(sql or "", rows)  # e.g., "Feb 2025", "2024–2025"

#         if not rows or (isinstance(rows, list) and len(rows) == 0):
#             # opener line + helpful bullets
#             line1 = f"{opener}: no data returned" + (f" for {time_ctx}." if time_ctx else ".")
#             bullets = [
#                 "- Check filters/date range.",
#                 "- Consider broadening constraints."
#             ]
#             return f"{line1}\n\n" + "\n".join(bullets)

#         prompt = f"""
# You are a precise business analyst with a friendly, human tone.

# TASK
# - Produce ONE short sentence that MUST start with "{opener}:" and clearly answers the question.
# - If time context is provided — "{time_ctx or 'N/A'}" — weave it naturally into the first sentence (e.g., "for Feb 2025").
# - Then produce 3–{max_bullets} concise bullets with concrete values strictly from the rows.
# - Each bullet MUST start with "- ".
# - Do not invent numbers. No emojis.

# CONTEXT
# Question:
# {question}

# SQL:
# {sql}

# TIME CONTEXT (if any): {time_ctx or "N/A"}

# ROWS (preview, JSON):
# {rows_for_prompt}

# OUTPUT FORMAT (Markdown)
# 1) First line starts with "{opener}:" and is ONE sentence.
# 2) Then 3–{max_bullets} bullets, each on its own line starting with "- ".
# """.strip()

#         llm = get_llama_maverick_llm()
#         resp = llm.invoke(prompt)
#         text = resp.content if hasattr(resp, "content") else (resp if isinstance(resp, str) else str(resp))
#         text = (text or "").strip()
#         text = re.sub(r"^\s*\*{0,2}summary:?\*{0,2}\s*", "", text, flags=re.I)

#         # Split to lines, keep non-empty
#         lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]

#         # Build headline (line 1)
#         first_line = lines[0] if lines else f"{opener}: concise summary."
#         if time_ctx and (time_ctx not in first_line):
#             if first_line.endswith((".", "!", "?")):
#                 first_line = first_line[:-1] + f" for {time_ctx}."
#             else:
#                 first_line = first_line + f" for {time_ctx}"

#         # Collect/normalize bullets from remaining lines
#         bullets = []
#         for ln in lines[1:]:
#             clean = re.sub(r"^\s*([-\*\u2022]|\d+\.)\s*", "", ln).strip()
#             if clean:
#                 bullets.append(f"- {clean}")

#         # Fallback: synthesize bullets from sample row if model didn't return any
#         if not bullets:
#             if isinstance(rows, list) and rows and isinstance(rows[0], dict):
#                 sample = rows[0]
#                 # up to 4 quick facts from the first row
#                 pairs = list(sample.items())[:4]
#                 bullets = [f"- {k}: {v}" for k, v in pairs] or ["- No additional details."]
#             else:
#                 bullets = ["- No additional details."]

#         # Cap bullet count
#         bullets = bullets[:max_bullets]

#         return f"{first_line}\n\n" + "\n".join(bullets)

#     except Exception as e:
#         print("⚠️ Summary generation failed:", str(e))
#         opener = _choose_dynamic_opener(question)
#         tc = _extract_time_context(sql or "", rows)
#         suffix = f" for {tc}" if tc else ""
#         return f"{opener}: summary not available{suffix}.\n\n- A brief error occurred while generating the summary.\n- Please retry or adjust the filters."
def _choose_dynamic_opener(question: str) -> str:
    import random
    q = (question or "").lower()

    def pick(pool):  # rotate phrases so it doesn't sound robotic
        return random.choice(pool)

    if any(w in q for w in ["trend", "over time", "month", "year", "growth", "decline", "increase", "decrease"]):
        return pick(["Trend check", "How it's moving", "The trajectory", "The trend"])
    if any(w in q for w in ["why", "driver", "reason", "root cause"]):
        return pick(["Likely drivers", "What's behind it", "Key reasons"])
    if any(w in q for w in ["how many", "count", "total", "sum", "volume"]):
        return pick(["By the numbers", "Quick totals", "Counts at a glance"])
    if any(w in q for w in ["segment", "segmentation", "breakdown", "distribution", "split"]):
        return pick(["Quick breakdown", "How it's split", "Segment snapshot"])
    if any(w in q for w in ["top", "highest", "best", "lowest", "which branch", "which state", "which customer", "performance"]):
        return pick(["Top takeaway", "Performance snapshot", "Quick headline"])
    if any(w in q for w in ["churn", "retention", "renewed", "not renewed"]):
        return pick(["Retention snapshot", "Churn focus", "Renewal picture"])
    if "claim" in q:
        return pick(["Claims snapshot", "Claims at a glance"])
    if any(w in q for w in ["revenue", "premium", "idv", "gwp"]):
        return pick(["Revenue snapshot", "Premium picture"])

    return pick(["Here's what stands out", "Good to know", "In short"])


def _extract_time_context(question: str, sql: str, rows) -> str:
    """
    Always extracts and returns the time context from SQL filters or row data.
    If row data doesn't contain time columns, it will be handled by the calling function.
    """
    import re, calendar

    year = None
    month = None
    
    # Extract from SQL filters first (most reliable)
    if sql:
        # Look for specific year filter
        m = re.search(r'policy_end_date_year\s*=\s*(\d{4})', sql, flags=re.I)
        if m: year = int(m.group(1))
        
        # Look for specific month filter
        m = re.search(r'policy_end_date_month\s*=\s*(\d{1,2})', sql, flags=re.I)
        if m:
            mm = int(m.group(1))
            if 1 <= mm <= 12: month = mm

        # Look for year range (IN clause)
        m = re.search(r'policy_end_date_year\s+IN\s*\(([^)]+)\)', sql, flags=re.I)
        if m and month is None:
            yrs = sorted({int(x) for x in re.findall(r'\d{4}', m.group(1))})
            if yrs:
                return f"{yrs[0]}–{yrs[-1]}" if len(yrs) > 1 else f"{yrs[0]}"

    # If we found explicit filters in SQL, use them
    if year and month:
        return f"{calendar.month_name[month][:3]} {year}"
    elif year:
        return f"{year}"

    def _pluck_ints(keys):
        vals = []
        if isinstance(rows, list) and rows:
            for r in rows:
                for k in keys:
                    if k in r and r[k] is not None:
                        try:
                            vals.append(int(str(r[k]).strip()))
                            break
                        except Exception:
                            pass
        return vals

    # Extract from row data if not found in SQL
    years = _pluck_ints(["policy_end_date_year", "policy_start_date_year", "year", "min_year", "max_year"])
    months = _pluck_ints(["policy_end_date_month", "policy_start_date_month", "month"])

    # Use row data if available
    if years:
        year_set = set(years)
        if len(year_set) == 1:
            year = years[0]
        elif len(year_set) > 1:
            return f"{min(years)}–{max(years)}"
    
    if months and not month:
        month_set = set(months)
        if len(month_set) == 1:
            month = months[0]

    # Format the final result
    if year and month:
        return f"{calendar.month_name[month][:3]} {year}"
    elif year:
        return f"{year}"
    
    # Return empty string if no time data found
    # The calling function should handle getting time context separately
    return ""


def get_time_context_from_db(sql: str, db_connection=None):
    """
    Helper function to get time context when main query doesn't include time columns.
    This should be called by the main application when _extract_time_context returns empty.
    """
    try:
        # Extract the WHERE clause from the original SQL to maintain same filters
        import re
        where_match = re.search(r'WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)', sql, re.IGNORECASE | re.DOTALL)
        where_clause = where_match.group(1) if where_match else "1=1"
        
        # Create a lightweight query to get time range
        time_query = f"""
        SELECT 
            MIN(policy_end_date_year) as min_year,
            MAX(policy_end_date_year) as max_year,
            COUNT(DISTINCT policy_end_date_year) as year_count,
            COUNT(DISTINCT policy_end_date_month) as month_count
        FROM "bi_dwh"."main_cai_lib"
        WHERE {where_clause}
        """
        
        # This should be executed by the calling application
        return time_query
    except Exception as e:
        return None

def _transform_column_names(rows):
    """
    Transform technical column names into business-friendly labels for summaries.
    """
    if not rows or not isinstance(rows, list):
        return rows
    
    # Column name mapping - technical to business-friendly
    column_mapping = {
        # Time columns
        'policy_end_date_year': 'Year',
        'policy_start_date_year': 'Policy Year', 
        'policy_end_date_month': 'Month',
        'policy_start_date_month': 'Policy Month',
        'min_year': 'From Year',
        'max_year': 'To Year',
        
        # Churn and status
        'is_churn': 'Status',
        'churn_probability': 'Churn Risk',
        'main_churn_reason': 'Churn Reason',
        
        # Counts and metrics
        'policy_count': 'Total Policies',
        'count': 'Total Count',
        'total_policies': 'Total Policies',
        'customer_count': 'Total Customers',
        'claim_count': 'Total Claims',
        
        # Financial columns
        'total_premium_payable': 'Total Premium',
        'own_damage_premium': 'Own Damage Premium',
        'third_party_premium': 'Third Party Premium',
        'vehicle_idv': 'Vehicle IDV',
        'total_revenue': 'Total Revenue',
        'customer_life_time_value': 'Customer Lifetime Value',
        
        # Customer and policy info
        'customer_segment': 'Customer Type',
        'customerid': 'Customer ID',
        'policy_no': 'Policy Number',
        'insured_client_name': 'Customer Name',
        'business_type': 'Business Type',
        'product_name': 'Product',
        
        # Vehicle info
        'car_manufacturer': 'Manufacturer',
        'vehicle_model': 'Vehicle Model',
        'vehicle_age': 'Vehicle Age',
        'vehicle_register_number': 'Registration Number',
        
        # Location
        'state': 'State',
        'zone': 'Zone',
        'branch_name': 'Branch',
        
        # Claims
        'number_of_claims': 'Claims Count',
        'claims_approved': 'Approved Claims',
        'claim_approval_rate': 'Approval Rate',
        
        # Other
        'policy_tenure': 'Policy Duration',
        'customer_tenure': 'Customer Duration',
        'primary_recommendation': 'Recommendation'
    }
    
    transformed_rows = []
    for row in rows:
        if isinstance(row, dict):
            new_row = {}
            for key, value in row.items():
                # Transform column name to business-friendly label
                friendly_key = column_mapping.get(key, key.replace('_', ' ').title())
                new_row[friendly_key] = value
            transformed_rows.append(new_row)
        else:
            transformed_rows.append(row)
    
    return transformed_rows


def _format_churn_status(value):
    """Format churn status values to be more readable"""
    if not value:
        return value
    
    value_str = str(value).lower()
    if 'not renewed' in value_str:
        return 'Not Renewed'
    elif 'renewed' in value_str:
        return 'Renewed'
    return value


# def generate_summary_from_rows(question, sql, rows, max_bullets: int = 6, db_connection=None):
#     """
#     Returns a compact summary:
#       1) <dynamic opener>: one-sentence answer (mentions time context when available)
#       2) 3–6 bullets on separate lines (one-by-one)

#     Uses ONLY the numbers present in `rows` with business-friendly column names.
#     """
#     import json, re

#     try:
#         preview = rows[:25] if isinstance(rows, list) else rows
        
#         # Transform column names to business-friendly labels
#         transformed_preview = _transform_column_names(preview)
        
#         rows_for_prompt = json.dumps(transformed_preview, ensure_ascii=False, default=str)

#         opener = _choose_dynamic_opener(question)
#         time_ctx = _extract_time_context(question, sql or "", rows)
        
#         # If no time context found in main data and we have db connection, try to get it
#         if not time_ctx and db_connection:
#             try:
#                 time_query = get_time_context_from_db(sql or "", db_connection)
#                 if time_query:
#                     # Execute the time query to get time context
#                     # This should be implemented by the calling application
#                     # For now, we'll work with what we have
#                     pass
#             except Exception as e:
#                 print(f"⚠️ Could not get time context from DB: {e}")

#         # Fallback: try to infer time context from current date if it's a churn query
#         if not time_ctx and sql and "is_churn" in sql.lower():
#             import datetime
#             current_year = datetime.datetime.now().year
#             # Assume current and previous year for churn analysis
#             time_ctx = f"{current_year-1}–{current_year}"

#         if not rows or (isinstance(rows, list) and len(rows) == 0):
#             line1 = f"{opener}: no data returned" + (f" for {time_ctx}." if time_ctx else ".")
#             bullets = [
#                 "- Check filters/date range.",
#                 "- Consider broadening constraints."
#             ]
#             return f"{line1}\n\n" + "\n".join(bullets)

#         prompt = f"""
# You are a precise business analyst with a friendly, human tone.

# TASK
# - Produce ONE short sentence that MUST start with "{opener}:" and clearly answers the question.
# - Include time context if provided: "{time_ctx or 'N/A'}". Use natural phrasing like "for {time_ctx}" or "across {time_ctx}".
# - Then produce 3–{max_bullets} concise bullets with concrete values strictly from the rows.
# - Each bullet MUST start with "- ".
# - Use business-friendly language, no technical column names.
# - Do not invent numbers. No emojis.

# CONTEXT
# Question: {question}

# TIME CONTEXT: {time_ctx or "N/A"}

# DATA (with business-friendly column names):
# {rows_for_prompt}

# OUTPUT FORMAT (Markdown)
# 1) First line starts with "{opener}:" and is ONE sentence.
# 2) If time context is available (not N/A), include it naturally in the first sentence.
# 3) Then 3–{max_bullets} bullets, each on its own line starting with "- ".
# 4) Use natural business language instead of technical terms.

# IMPORTANT: 
# - Include time context in the first sentence if available
# - Use business-friendly terms like "Total Policies: 233900" instead of "policy_count: 233900"
# - Format status values nicely (e.g., "Status: Not Renewed" instead of "is_churn: not renewed")
# """.strip()

#         llm = get_llama_maverick_llm()
#         resp = llm.invoke(prompt)
#         text = resp.content if hasattr(resp, "content") else (resp if isinstance(resp, str) else str(resp))
#         text = (text or "").strip()
#         text = re.sub(r"^\s*\*{0,2}summary:?\*{0,2}\s*", "", text, flags=re.I)

#         # Split to lines, keep non-empty
#         lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]

#         # Build headline (line 1)
#         first_line = lines[0] if lines else f"{opener}: concise summary."
        
#         # Add time context if it exists and wasn't already included
#         if time_ctx and (time_ctx not in first_line):
#             if first_line.endswith((".", "!", "?")):
#                 first_line = first_line[:-1] + f" across {time_ctx}."
#             else:
#                 first_line = first_line + f" across {time_ctx}"

#         # Collect/normalize bullets from remaining lines
#         bullets = []
#         for ln in lines[1:]:
#             clean = re.sub(r"^\s*([-\*\u2022]|\d+\.)\s*", "", ln).strip()
#             if clean:
#                 bullets.append(f"- {clean}")

#         # Fallback: synthesize bullets from sample row if model didn't return any
#         if not bullets:
#             if isinstance(transformed_preview, list) and transformed_preview and isinstance(transformed_preview[0], dict):
#                 sample = transformed_preview[0]
#                 # up to 4 quick facts from the first row with business-friendly formatting
#                 pairs = []
#                 for k, v in list(sample.items())[:4]:
#                     if k.lower() == 'status':
#                         v = _format_churn_status(v)
#                     pairs.append(f"{k}: {v}")
#                 bullets = [f"- {pair}" for pair in pairs] or ["- No additional details."]
#             else:
#                 bullets = ["- No additional details."]

#         # Cap bullet count
#         bullets = bullets[:max_bullets]

#         return f"{first_line}\n\n" + "\n".join(bullets)

#     except Exception as e:
#         print("⚠️ Summary generation failed:", str(e))
#         opener = _choose_dynamic_opener(question)
#         tc = _extract_time_context(question, sql or "", rows)
#         suffix = f" across {tc}" if tc else ""
#         return f"{opener}: summary not available{suffix}.\n\n- A brief error occurred while generating the summary.\n- Please retry or adjust the filters."



import json
from decimal import Decimal
from typing import List, Dict, Any

def _convert_decimals_to_float(obj):
    """
    Recursively convert all Decimal objects to float for JSON serialization.
    This fixes the "Object of type Decimal is not JSON serializable" error.
    """
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {key: _convert_decimals_to_float(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [_convert_decimals_to_float(item) for item in obj]
    return obj

def generate_summary_from_rows(question, sql, rows, max_bullets: int = 6, db_connection=None, existing_summary=None):
    """
    SQL-TRUTH summary generator.

    GUARANTEE:
    - Describes ONLY what the SQL query returned
    - No averages, ranges, min/max
    - No inference or interpretation
    - No recomputation
    """
    import re

    # ========== USE EXISTING SUMMARY IF PROVIDED AND VALID ==========
    if existing_summary:
        total_rows = len(rows) if isinstance(rows, list) else 0
        total_str = f"{total_rows:,}"
        if total_str in existing_summary or str(total_rows) in existing_summary:
            return existing_summary

    try:
        opener = _choose_dynamic_opener(question)
        total_rows = len(rows) if isinstance(rows, list) else 0

        # ========== EMPTY RESULT ==========
        if not rows or (isinstance(rows, list) and len(rows) == 0):
            return f"{opener}: no results were returned for this query."

        # ✅ FIX: Convert all Decimal objects to float BEFORE any processing
        rows = _convert_decimals_to_float(rows)

        # 🚨 KPI SAFETY: Never rescale percentages in narrative
        for row in rows:
            for k, v in row.items():
                if isinstance(v, (int, float)):
                    # If SQL already returned percentage, keep as-is
                    if k.endswith("_percentage"):
                        continue

                    # If metric name implies rate but value <= 1 → DO NOT convert
                    if "rate" in k.lower() and v <= 1:
                        # Explicitly mark as fraction to prevent later scaling
                        row[k] = round(v, 4)


        # ========== DETECT SINGLE METRIC (SAFE FOR LLM) ==========
        if (
            isinstance(rows, list)
            and len(rows) == 1
            and isinstance(rows[0], dict)
            and len(rows[0]) == 1
            and isinstance(next(iter(rows[0].values())), (int, float))
        ):
            col, val = next(iter(rows[0].items()))
            return (
                f"{opener}: the query returned a single result.\n\n"
                f"- {col.replace('_',' ').title()}: {val:,}"
            )

        # ========== ROW-LEVEL RESULT (NO LLM ALLOWED) ==========
        # Deterministic, SQL-safe narration
        columns = list(rows[0].keys())
        
        # Clean column names for display (remove underscores, title case)
        clean_columns = [col.replace('_', ' ').title() for col in columns]

        return (
            f"{opener}: we found {total_rows:,} records that match your query.\n\n"
            f"The dataset includes the following fields: {', '.join(clean_columns)}."
        )

    except Exception as e:
        print(f"⚠️ Summary generation error: {e}")
        total = len(rows) if isinstance(rows, list) else 0
        return (
            f"{_choose_dynamic_opener(question)}: summary generation encountered an error.\n\n"
            f"- Total records: {total:,}\n"
            f"- Please retry or contact support."
        )

def generate_summary_from_rows3012(question, sql, rows, max_bullets: int = 6, db_connection=None, existing_summary=None):
    """
    SQL-TRUTH summary generator.

    GUARANTEE:
    - Describes ONLY what the SQL query returned
    - No averages, ranges, min/max
    - No inference or interpretation
    - No recomputation
    """
    import re

    # ========== USE EXISTING SUMMARY IF PROVIDED AND VALID ==========
    if existing_summary:
        total_rows = len(rows) if isinstance(rows, list) else 0
        total_str = f"{total_rows:,}"
        if total_str in existing_summary or str(total_rows) in existing_summary:
            return existing_summary

    try:
        opener = _choose_dynamic_opener(question)
        total_rows = len(rows) if isinstance(rows, list) else 0

        # ========== EMPTY RESULT ==========
        if not rows or (isinstance(rows, list) and len(rows) == 0):
            return f"{opener}: no results were returned for this query."

        # ========== DETECT SINGLE METRIC (SAFE FOR LLM) ==========
        if (
            isinstance(rows, list)
            and len(rows) == 1
            and isinstance(rows[0], dict)
            and len(rows[0]) == 1
            and isinstance(next(iter(rows[0].values())), (int, float))
        ):
            col, val = next(iter(rows[0].items()))
            return (
                f"{opener}: the query returned a single result.\n\n"
                f"- {col.replace('_',' ').title()}: {val:,}"
            )

        # ========== ROW-LEVEL RESULT (NO LLM ALLOWED) ==========
        # Deterministic, SQL-safe narration
        columns = list(rows[0].keys())

        return (
            f"{opener}: we found {total_rows:,} records that match the query.\n\n"
            f"- Each row represents one record returned by the SQL query\n"
            f"- Columns included: {', '.join(columns)}"
        )

    except Exception:
        total = len(rows) if isinstance(rows, list) else 0
        return (
            f"{_choose_dynamic_opener(question)}: summary generation encountered an error.\n\n"
            f"- Total records: {total:,}\n"
            f"- Please retry or contact support."
        )


def _generate_fallback_bullets(stats, max_bullets):
    """
    Retained for compatibility with existing code paths.
    Fully neutralized to avoid analytics leakage.
    """
    bullets = []
    bullets.append(f"- Total Records: {stats.get('total_rows', 0):,}")
    return bullets[:max_bullets]



# def generate_summary_from_rows(question, sql, rows, max_bullets: int = 6, db_connection=None, existing_summary=None):
#     """
#     Returns a compact summary with accurate aggregate statistics.
    
#     Args:
#         existing_summary: If provided, validates and enhances this summary instead of generating new
#     """
#     import json
#     import re
    
#     # ========== USE EXISTING SUMMARY IF PROVIDED AND VALID ==========
#     if existing_summary:
#         print(f"📋 Existing summary provided: {existing_summary[:100]}...")
        
#         # Validate that existing summary has the correct row count
#         total_rows = len(rows) if isinstance(rows, list) else 0
#         total_str = f"{total_rows:,}"
        
#         if total_str in existing_summary or str(total_rows) in existing_summary:
#             print(f"✅ Existing summary is valid, using it")
#             return existing_summary
#         else:
#             print(f"⚠️ Existing summary missing total count {total_str}, will regenerate")
#             # Fall through to regeneration logic

#     try:
#         # ========== HANDLE EMPTY RESULTS ==========
#         if not rows or (isinstance(rows, list) and len(rows) == 0):
#             opener = _choose_dynamic_opener(question)
#             time_ctx = _extract_time_context(question, sql or "", rows)
#             line1 = f"{opener}: no data returned" + (f" for {time_ctx}." if time_ctx else ".")
#             bullets = [
#                 "- Check filters/date range.",
#                 "- Consider broadening constraints."
#             ]
#             return f"{line1}\n\n" + "\n".join(bullets)

#         # ========== CALCULATE AGGREGATE STATISTICS FROM ALL ROWS ==========
#         total_rows = len(rows) if isinstance(rows, list) else 0
        
#         print(f"📊 Calculating aggregate stats from {total_rows:,} rows")
        
#         stats = {
#             'total_rows': total_rows,
#         }
        
#         # Detect which columns exist in the data
#         if isinstance(rows, list) and rows and isinstance(rows[0], dict):
#             sample_row = rows[0]
            
#             # ========== COUNT UNIQUE VALUES FOR KEY COLUMNS ==========
#             unique_counts = {}
#             key_columns = [
#                 'customerid', 'policy_no', 'insured_client_name', 'customer_segment', 
#                 'state', 'branch_name', 'zone', 'main_churn_reason'
#             ]
            
#             for col in key_columns:
#                 if col in sample_row:
#                     unique_vals = set()
#                     for row in rows:
#                         val = row.get(col)
#                         # Skip None, empty strings, and whitespace-only values
#                         if val is not None:
#                             val_str = str(val).strip()
#                             if val_str and val_str.lower() not in ['none', 'null', 'n/a', '']:
#                                 unique_vals.add(val_str)
                    
#                     if unique_vals:
#                         unique_counts[col] = len(unique_vals)
#                         print(f"   • {col}: {len(unique_vals):,} unique values")
            
#             stats['unique_counts'] = unique_counts
            
#             # ========== CALCULATE SUMS FOR NUMERIC COLUMNS ==========
#             numeric_sums = {}
#             numeric_columns = [
#                 'total_premium_payable', 'vehicle_idv', 'own_damage_premium', 
#                 'third_party_premium', 'customer_life_time_value'
#             ]
            
#             for col in numeric_columns:
#                 if col in sample_row:
#                     total = 0
#                     count = 0
#                     for row in rows:
#                         val = row.get(col)
#                         if val is not None:
#                             try:
#                                 num_val = float(val)
#                                 if num_val > 0:  # Ignore negative/zero values for sums
#                                     total += num_val
#                                     count += 1
#                             except (ValueError, TypeError):
#                                 pass
                    
#                     if count > 0:
#                         numeric_sums[col] = {
#                             'total': total,
#                             'average': total / count,
#                             'count': count
#                         }
#                         print(f"   • {col}: total={total:,.2f}, avg={total/count:,.2f}, count={count:,}")
            
#             stats['numeric_sums'] = numeric_sums
        
#         print(f"📊 Summary stats prepared for {stats['total_rows']:,} rows")

#         # ========== PREPARE STRUCTURED DATA FOR LLM ==========
#         # Transform column names for sample records
#         preview = rows[:5] if isinstance(rows, list) else []
#         transformed_preview = _transform_column_names(preview)
        
#         # Build aggregate statistics with business-friendly names
#         aggregate_stats = {
#             'total_records': stats['total_rows'],
#             'unique_counts': {},
#             'totals': {}
#         }
        
#         # Map technical column names to business-friendly names
#         unique_col_mapping = {
#             'customerid': 'unique_customers',
#             'policy_no': 'unique_policies',
#             'insured_client_name': 'unique_client_names',
#             'customer_segment': 'unique_segments',
#             'state': 'unique_states',
#             'branch_name': 'unique_branches',
#             'zone': 'unique_zones',
#             'main_churn_reason': 'unique_churn_reasons'
#         }
        
#         if 'unique_counts' in stats:
#             for col, count in stats['unique_counts'].items():
#                 friendly_name = unique_col_mapping.get(col, col)
#                 aggregate_stats['unique_counts'][friendly_name] = count
        
#         numeric_col_mapping = {
#             'total_premium_payable': 'total_premium',
#             'vehicle_idv': 'total_vehicle_value',
#             'own_damage_premium': 'total_own_damage_premium',
#             'third_party_premium': 'total_third_party_premium',
#             'customer_life_time_value': 'total_customer_lifetime_value'
#         }
        
#         if 'numeric_sums' in stats:
#             for col, data in stats['numeric_sums'].items():
#                 friendly_name = numeric_col_mapping.get(col, col)
#                 aggregate_stats['totals'][friendly_name] = {
#                     'total': round(data['total'], 2),
#                     'average': round(data['average'], 2),
#                     'count': data['count']
#                 }
        
#         # ========== BUILD LLM PROMPT ==========
#         opener = _choose_dynamic_opener(question)
#         time_ctx = _extract_time_context(question, sql or "", rows)
        
#         # Create clear separation between aggregates and samples
#         data_for_llm = {
#             'AGGREGATE_STATISTICS': aggregate_stats,
#             'SAMPLE_RECORDS_FOR_CONTEXT_ONLY': transformed_preview
#         }
        
#         data_json = json.dumps(data_for_llm, ensure_ascii=False, default=str, indent=2)
        
#         # Build prompt based on whether time context exists
#         if time_ctx:
#             prompt = f"""You are a business analyst creating a concise summary.

# QUESTION: {question}
# TIME PERIOD: {time_ctx}

# DATA:
# {data_json}

# CRITICAL INSTRUCTIONS:
# 1. First sentence MUST start with: "{opener}:"
# 2. MUST use AGGREGATE_STATISTICS.total_records ({stats['total_rows']:,}) as the main count
# 3. MUST mention the time period "{time_ctx}" naturally in the first sentence
# 4. Then add {max_bullets-1} to {max_bullets} bullet points with specific numbers from AGGREGATE_STATISTICS
# 5. Each bullet MUST start with "- "
# 6. Use only numbers from AGGREGATE_STATISTICS section (NOT from sample records)
# 7. Use business-friendly language, no technical jargon
# 8. NO emojis, NO invented numbers

# CORRECT FORMAT:
# {opener}: We found {stats['total_rows']:,} [description] in {time_ctx}.

# - [Insight with number from unique_counts]
# - [Insight with number from totals]
# - [Insight with number from AGGREGATE_STATISTICS]

# EXAMPLE (DO THIS):
# {opener}: We found {stats['total_rows']:,} policies in {time_ctx}.

# - Unique Customers: 45,230
# - Total Premium: ₹125,450,000
# - Coverage across 15 states

# WRONG (DON'T DO THIS):
# - "5 sample records shown" ❌
# - Not mentioning {time_ctx} ❌
# - Using sample record counts instead of total_records ❌

# Generate the summary NOW using ONLY AGGREGATE_STATISTICS numbers:"""

#         else:
#             prompt = f"""You are a business analyst creating a concise summary.

# QUESTION: {question}

# DATA:
# {data_json}

# CRITICAL INSTRUCTIONS:
# 1. First sentence MUST start with: "{opener}:"
# 2. MUST use AGGREGATE_STATISTICS.total_records ({stats['total_rows']:,}) as the main count
# 3. Do NOT mention any time period (user didn't ask for one)
# 4. Then add {max_bullets-1} to {max_bullets} bullet points with specific numbers from AGGREGATE_STATISTICS
# 5. Each bullet MUST start with "- "
# 6. Use only numbers from AGGREGATE_STATISTICS section (NOT from sample records)
# 7. Use business-friendly language, no technical jargon
# 8. NO emojis, NO invented numbers

# CORRECT FORMAT:
# {opener}: We found {stats['total_rows']:,} [description].

# - [Insight with number from unique_counts]
# - [Insight with number from totals]
# - [Insight with number from AGGREGATE_STATISTICS]

# EXAMPLE (DO THIS):
# {opener}: We found {stats['total_rows']:,} renewed policies.

# - Unique Customers: 12,450
# - Total Lifetime Value: ₹89,340,000
# - Spread across 8 branches

# WRONG (DON'T DO THIS):
# - "5 sample records shown" ❌
# - Mentioning time periods ❌
# - Using sample record counts instead of total_records ❌

# Generate the summary NOW using ONLY AGGREGATE_STATISTICS numbers:"""

#         # ========== INVOKE LLM ==========
#         llm = get_llama_maverick_llm()
#         resp = llm.invoke(prompt)
#         text = resp.content if hasattr(resp, "content") else (resp if isinstance(resp, str) else str(resp))
#         text = (text or "").strip()
        
#         # Clean up common LLM artifacts
#         text = re.sub(r"^\s*\*{0,2}summary:?\*{0,2}\s*", "", text, flags=re.I)
#         text = re.sub(r"^\s*\*{0,2}answer:?\*{0,2}\s*", "", text, flags=re.I)
        
#         print(f"🤖 LLM raw response: {text[:200]}...")

#         # ========== VALIDATE LLM RESPONSE ==========
#         # Check if LLM included the actual total count
#         total_str = f"{stats['total_rows']:,}"
#         if total_str not in text and str(stats['total_rows']) not in text:
#             print(f"⚠️ LLM response missing total count {total_str}, forcing correction...")
            
#             # Force correct first line
#             first_line = f"{opener}: We found {total_str} records"
#             if time_ctx:
#                 first_line += f" in {time_ctx}"
#             first_line += "."
            
#             # Extract any valid bullets from LLM response
#             lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]
#             bullets = []
#             for ln in lines:
#                 if ln.strip().startswith(('-', '•', '*')) or re.match(r'^\s*\d+\.', ln):
#                     clean = re.sub(r"^\s*([-\*\u2022]|\d+\.)\s*", "", ln).strip()
#                     if clean and len(clean) > 5:  # Meaningful bullet
#                         bullets.append(f"- {clean}")
            
#             # If no valid bullets, create them from stats
#             if not bullets:
#                 bullets = _generate_fallback_bullets(stats, max_bullets)
            
#             result = f"{first_line}\n\n" + "\n".join(bullets[:max_bullets])
#             print(f"✅ Corrected summary generated: {len(result)} chars")
#             return result

#         # ========== PROCESS LLM RESPONSE ==========
#         lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]

#         # Extract first line (headline)
#         first_line = lines[0] if lines else f"{opener}: concise summary."
        
#         # Ensure time context is in first line if it should be there
#         if time_ctx and (time_ctx not in first_line):
#             if first_line.endswith((".", "!", "?")):
#                 first_line = first_line[:-1] + f" in {time_ctx}."
#             else:
#                 first_line = first_line + f" in {time_ctx}"

#         # Extract and normalize bullets
#         bullets = []
#         for ln in lines[1:]:
#             if ln.strip().startswith(('-', '•', '*')) or re.match(r'^\s*\d+\.', ln):
#                 clean = re.sub(r"^\s*([-\*\u2022]|\d+\.)\s*", "", ln).strip()
#                 if clean and len(clean) > 5:  # Meaningful content
#                     bullets.append(f"- {clean}")

#         # Fallback: generate bullets from stats if none found
#         if not bullets:
#             print("⚠️ No bullets found in LLM response, generating from stats...")
#             bullets = _generate_fallback_bullets(stats, max_bullets)

#         # Cap bullet count
#         bullets = bullets[:max_bullets]

#         result = f"{first_line}\n\n" + "\n".join(bullets)
#         print(f"✅ Summary generated: {len(result)} chars")
#         return result

#     except Exception as e:
#         print(f"⚠️ Summary generation failed: {str(e)}")
#         import traceback
#         print(traceback.format_exc())
        
#         opener = _choose_dynamic_opener(question)
#         tc = _extract_time_context(question, sql or "", rows)
#         suffix = f" in {tc}" if tc else ""
#         total = len(rows) if isinstance(rows, list) else 0
        
#         return f"{opener}: summary generation encountered an error{suffix}.\n\n- Total records: {total:,}\n- Please retry or contact support."


# def _generate_fallback_bullets(stats, max_bullets):
#     """Generate fallback bullets from aggregate statistics"""
#     bullets = []
    
#     # Add unique counts
#     if 'unique_counts' in stats and stats['unique_counts']:
#         unique_items = list(stats['unique_counts'].items())
        
#         # Prioritize policy_no and customerid
#         priority_cols = ['policy_no', 'customerid']
#         for col in priority_cols:
#             if col in stats['unique_counts']:
#                 count = stats['unique_counts'][col]
#                 friendly_name = 'Unique Policies' if col == 'policy_no' else 'Unique Customers'
#                 bullets.append(f"- {friendly_name}: {count:,}")
        
#         # Add other unique counts if space available
#         for col, count in unique_items:
#             if col not in priority_cols and len(bullets) < max_bullets - 1:
#                 friendly_name = col.replace('_', ' ').title()
#                 bullets.append(f"- {friendly_name}: {count:,}")
    
#     # Add numeric totals
#     if 'numeric_sums' in stats and stats['numeric_sums'] and len(bullets) < max_bullets:
#         numeric_items = list(stats['numeric_sums'].items())
        
#         # Prioritize total_premium_payable
#         if 'total_premium_payable' in stats['numeric_sums']:
#             data = stats['numeric_sums']['total_premium_payable']
#             total = data['total']
#             bullets.append(f"- Total Premium: ₹{total:,.2f}")
        
#         # Add other numeric values if space available
#         for col, data in numeric_items:
#             if col != 'total_premium_payable' and len(bullets) < max_bullets:
#                 friendly_name = col.replace('_', ' ').title()
#                 total = data['total']
#                 bullets.append(f"- {friendly_name}: ₹{total:,.2f}")
    
#     # Ensure at least one bullet
#     if not bullets:
#         bullets.append(f"- Total Records: {stats['total_rows']:,}")
    
#     return bullets[:max_bullets]


def generate_summary_from_rowssss(question, sql, rows, max_bullets: int = 6, db_connection=None):
    """
    Returns a compact summary with accurate aggregate statistics
    """
    import json, re

    try:
        if not rows or (isinstance(rows, list) and len(rows) == 0):
            opener = _choose_dynamic_opener(question)
            time_ctx = _extract_time_context(question, sql or "", rows)
            line1 = f"{opener}: no data returned" + (f" for {time_ctx}." if time_ctx else ".")
            bullets = [
                "- Check filters/date range.",
                "- Consider broadening constraints."
            ]
            return f"{line1}\n\n" + "\n".join(bullets)

        # ========== CALCULATE AGGREGATE STATISTICS FROM ALL ROWS ==========
        total_rows = len(rows) if isinstance(rows, list) else 0
        
        print(f"📊 Calculating aggregate stats from {total_rows:,} rows")
        
        # Calculate unique counts for common columns
        stats = {
            'total_rows': total_rows,
        }
        
        # Detect which columns exist in the data
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            sample_row = rows[0]
            
            # Count unique values for key columns
            unique_counts = {}
            for col in ['customerid', 'policy_no', 'insured_client_name', 'customer_segment', 
                       'state', 'branch_name', 'zone', 'main_churn_reason']:
                if col in sample_row:
                    unique_vals = set()
                    for row in rows:
                        val = row.get(col)
                        if val is not None and str(val).strip():  # ← Added .strip() check
                            unique_vals.add(str(val))
                    if unique_vals:
                        unique_counts[col] = len(unique_vals)
                        print(f"   • {col}: {len(unique_vals):,} unique values")
            
            stats['unique_counts'] = unique_counts
            
            # Calculate sums for numeric columns
            numeric_sums = {}
            for col in ['total_premium_payable', 'vehicle_idv', 'own_damage_premium', 
                       'third_party_premium', 'customer_life_time_value']:
                if col in sample_row:
                    total = 0
                    count = 0
                    for row in rows:
                        val = row.get(col)
                        if val is not None:
                            try:
                                total += float(val)
                                count += 1
                            except (ValueError, TypeError):
                                pass
                    if count > 0:
                        numeric_sums[col] = {
                            'total': total,
                            'average': total / count,
                            'count': count
                        }
                        print(f"   • {col}: total={total:,.2f}, avg={total/count:,.2f}")
            
            stats['numeric_sums'] = numeric_sums
        
        # ========== PREPARE DATA FOR LLM ==========
        # Take first 10 rows as examples + aggregate statistics
        preview = rows[:10] if isinstance(rows, list) else rows
        transformed_preview = _transform_column_names(preview)
        
        # Build a summary statistics object for the LLM
        summary_stats = {
            'total_records': stats['total_rows'],
            'sample_records': transformed_preview,
        }
        
        # Add unique counts with business-friendly names
        if 'unique_counts' in stats:
            friendly_unique = {}
            col_mapping = {
                'customerid': 'unique_customers',
                'policy_no': 'unique_policies',
                'insured_client_name': 'unique_client_names',
                'customer_segment': 'unique_segments',
                'state': 'unique_states',
                'branch_name': 'unique_branches',
                'zone': 'unique_zones',
                'main_churn_reason': 'unique_churn_reasons'
            }
            for col, count in stats['unique_counts'].items():
                friendly_name = col_mapping.get(col, col)
                friendly_unique[friendly_name] = count
            summary_stats['unique_counts'] = friendly_unique
        
        # Add numeric totals with business-friendly names
        if 'numeric_sums' in stats:
            friendly_numeric = {}
            col_mapping = {
                'total_premium_payable': 'total_premium',
                'vehicle_idv': 'total_vehicle_value',
                'own_damage_premium': 'total_own_damage_premium',
                'third_party_premium': 'total_third_party_premium',
                'customer_life_time_value': 'total_customer_lifetime_value'
            }
            for col, data in stats['numeric_sums'].items():
                friendly_name = col_mapping.get(col, col)
                friendly_numeric[friendly_name] = {
                    'total': round(data['total'], 2),
                    'average': round(data['average'], 2)
                }
            summary_stats['numeric_totals'] = friendly_numeric
        
        rows_for_prompt = json.dumps(summary_stats, ensure_ascii=False, default=str, indent=2)
        
        print(f"📊 Summary stats prepared: {len(rows_for_prompt)} chars")

        opener = _choose_dynamic_opener(question)
        
        # Extract time context ONLY from SQL filters
        time_ctx = _extract_time_context(question, sql or "", rows)
        
        # Build prompt based on whether time context exists
        if time_ctx:
            # User asked for specific time period
            prompt = f"""
You are a precise business analyst with a friendly, human tone.

TASK
- Produce ONE short sentence that MUST start with "{opener}:" and clearly answers the question.
- Include the time context "{time_ctx}" naturally in the sentence using phrasing like "for {time_ctx}" or "in {time_ctx}".
- Then produce 3–{max_bullets} concise bullets with concrete values from the data.
- Each bullet MUST start with "- ".
- Use business-friendly language, no technical column names.
- **CRITICAL**: Use the AGGREGATE STATISTICS provided (total_records, unique_counts, sums) - these represent ALL {stats['total_rows']:,} rows, NOT just the sample records.
- Do not invent numbers. No emojis.

CONTEXT
Question: {question}
Time Period: {time_ctx}

DATA WITH AGGREGATE STATISTICS (representing ALL {stats['total_rows']:,} rows):
{rows_for_prompt}

OUTPUT FORMAT (Markdown)
1) First line starts with "{opener}:" and includes the time period "{time_ctx}".
2) Use the TOTAL_RECORDS ({stats['total_rows']:,}) as the main count - this is the TOTAL number of rows returned.
3) Then 3–{max_bullets} bullets using aggregate statistics (unique_counts, numeric_totals).
4) Each bullet starts with "- ".

EXAMPLES OF CORRECT USAGE:
- "We found {stats['total_rows']:,} policies in 2025..." (using total_records)
- "These policies represent 5,234 unique customers" (using unique_counts.unique_customers)
- "Total premium across all policies: $12.5M" (using numeric_totals.total_premium.total)

IMPORTANT: 
- **The MOST IMPORTANT number is total_records = {stats['total_rows']:,}** - use this as the main count in your first sentence
- MUST mention the time period "{time_ctx}" in the first sentence
- Use business-friendly formatting like "Total: 15,868 policies" or "Unique Customers: 10,234"
- The sample_records array is just examples - use the aggregate statistics for actual counts
""".strip()
        else:
            # User did NOT ask for specific time period
            prompt = f"""
You are a precise business analyst with a friendly, human tone.

TASK
- Produce ONE short sentence that MUST start with "{opener}:" and clearly answers the question.
- Do NOT mention any time period since the user didn't ask for one.
- Then produce 3–{max_bullets} concise bullets with concrete values from the data.
- Each bullet MUST start with "- ".
- Use business-friendly language, no technical column names.
- **CRITICAL**: Use the AGGREGATE STATISTICS provided (total_records, unique_counts, sums) - these represent ALL {stats['total_rows']:,} rows, NOT just the sample records.
- Do not invent numbers. No emojis.

CONTEXT
Question: {question}

DATA WITH AGGREGATE STATISTICS (representing ALL {stats['total_rows']:,} rows):
{rows_for_prompt}

OUTPUT FORMAT (Markdown)
1) First line starts with "{opener}:" - do NOT add any time context.
2) Use the TOTAL_RECORDS ({stats['total_rows']:,}) as the main count - this is the TOTAL number of rows returned.
3) Then 3–{max_bullets} bullets using aggregate statistics (unique_counts, numeric_totals).
4) Each bullet starts with "- ".

EXAMPLES OF CORRECT USAGE:
- "We found {stats['total_rows']:,} policies from Bengaluru branch..." (using total_records)
- "These policies represent 8,432 unique customers" (using unique_counts.unique_customers)
- "Total lifetime value: $45.2M across all customers" (using numeric_totals)

IMPORTANT: 
- **The MOST IMPORTANT number is total_records = {stats['total_rows']:,}** - use this as the main count in your first sentence
- Do NOT mention time periods since user didn't ask for it
- Use business-friendly formatting like "Total: 15,868 policies" or "Unique Customers: 10,234"
- The sample_records array is just examples - use the aggregate statistics for actual counts
- Example: "We found {stats['total_rows']:,} renewed policies from 8,234 unique customers" (using real aggregate stats, NOT sample data)
""".strip()

        llm = get_llama_maverick_llm()
        resp = llm.invoke(prompt)
        text = resp.content if hasattr(resp, "content") else (resp if isinstance(resp, str) else str(resp))
        text = (text or "").strip()
        text = re.sub(r"^\s*\*{0,2}summary:?\*{0,2}\s*", "", text, flags=re.I)

        # Split to lines, keep non-empty
        lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]

        # Build headline (line 1)
        first_line = lines[0] if lines else f"{opener}: concise summary."
        
        # Add time context ONLY if it exists AND wasn't already included by LLM
        if time_ctx and (time_ctx not in first_line):
            if first_line.endswith((".", "!", "?")):
                first_line = first_line[:-1] + f" for {time_ctx}."
            else:
                first_line = first_line + f" for {time_ctx}"

        # Collect/normalize bullets from remaining lines
        bullets = []
        for ln in lines[1:]:
            clean = re.sub(r"^\s*([-\*\u2022]|\d+\.)\s*", "", ln).strip()
            if clean:
                bullets.append(f"- {clean}")

        # Fallback: synthesize bullets from aggregate stats if model didn't return any
        if not bullets:
            bullets = []
            # Prioritize showing the total count first
            bullets.append(f"- Total Records: {stats['total_rows']:,}")
            
            if 'unique_counts' in stats:
                for key, count in list(stats['unique_counts'].items())[:2]:  # Top 2 unique counts
                    friendly_key = key.replace('_', ' ').title()
                    bullets.append(f"- {friendly_key}: {count:,}")
            
            bullets = bullets[:max_bullets]

        # Cap bullet count
        bullets = bullets[:max_bullets]

        result = f"{first_line}\n\n" + "\n".join(bullets)
        print(f"✅ Summary generated: {len(result)} chars")
        return result

    except Exception as e:
        print("⚠️ Summary generation failed:", str(e))
        import traceback
        print(traceback.format_exc())
        opener = _choose_dynamic_opener(question)
        tc = _extract_time_context(question, sql or "", rows)
        suffix = f" for {tc}" if tc else ""
        total = len(rows) if isinstance(rows, list) else 0
        return f"{opener}: summary not available{suffix}.\n\n- Total records analyzed: {total:,}\n- A brief error occurred while generating the summary.\n- Please retry or adjust the filters."

def generate_summary_from_rows412(question, sql, rows, max_bullets: int = 6, db_connection=None):
    """
    Returns a compact summary:
      1) <dynamic opener>: one-sentence answer (mentions time context ONLY if user asked for it)
      2) 3–6 bullets on separate lines (one-by-one)

    Uses ONLY the numbers present in `rows` with business-friendly column names.
    """
    import json, re

    try:
        if not rows or (isinstance(rows, list) and len(rows) == 0):
            opener = _choose_dynamic_opener(question)
            time_ctx = _extract_time_context(question, sql or "", rows)
            line1 = f"{opener}: no data returned" + (f" for {time_ctx}." if time_ctx else ".")
            bullets = [
                "- Check filters/date range.",
                "- Consider broadening constraints."
            ]
            return f"{line1}\n\n" + "\n".join(bullets)

        # ========== CALCULATE AGGREGATE STATISTICS FROM ALL ROWS ==========
        total_rows = len(rows) if isinstance(rows, list) else 0
        
        # Calculate unique counts for common columns
        stats = {
            'total_rows': total_rows,
        }
        
        # Detect which columns exist in the data
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            sample_row = rows[0]
            
            # Count unique values for key columns
            unique_counts = {}
            for col in ['customerid', 'policy_no', 'insured_client_name', 'customer_segment', 
                       'state', 'branch_name', 'zone', 'main_churn_reason']:
                if col in sample_row:
                    unique_vals = set()
                    for row in rows:
                        val = row.get(col)
                        if val is not None:
                            unique_vals.add(str(val))
                    if unique_vals:
                        unique_counts[col] = len(unique_vals)
            
            stats['unique_counts'] = unique_counts
            
            # Calculate sums for numeric columns
            numeric_sums = {}
            for col in ['total_premium_payable', 'vehicle_idv', 'own_damage_premium', 
                       'third_party_premium', 'customer_life_time_value']:
                if col in sample_row:
                    total = 0
                    count = 0
                    for row in rows:
                        val = row.get(col)
                        if val is not None:
                            try:
                                total += float(val)
                                count += 1
                            except (ValueError, TypeError):
                                pass
                    if count > 0:
                        numeric_sums[col] = {
                            'total': total,
                            'average': total / count,
                            'count': count
                        }
            
            stats['numeric_sums'] = numeric_sums
        
        # ========== PREPARE DATA FOR LLM ==========
        # Take first 10 rows as examples + aggregate statistics
        preview = rows[:10] if isinstance(rows, list) else rows
        transformed_preview = _transform_column_names(preview)
        
        # Build a summary statistics object for the LLM
        summary_stats = {
            'total_records': stats['total_rows'],
            'sample_records': transformed_preview,
        }
        
        # Add unique counts with business-friendly names
        if 'unique_counts' in stats:
            friendly_unique = {}
            col_mapping = {
                'customerid': 'unique_customers',
                'policy_no': 'unique_policies',
                'insured_client_name': 'unique_client_names',
                'customer_segment': 'unique_segments',
                'state': 'unique_states',
                'branch_name': 'unique_branches',
                'zone': 'unique_zones',
                'main_churn_reason': 'unique_churn_reasons'
            }
            for col, count in stats['unique_counts'].items():
                friendly_name = col_mapping.get(col, col)
                friendly_unique[friendly_name] = count
            summary_stats['unique_counts'] = friendly_unique
        
        # Add numeric totals with business-friendly names
        if 'numeric_sums' in stats:
            friendly_numeric = {}
            col_mapping = {
                'total_premium_payable': 'total_premium',
                'vehicle_idv': 'total_vehicle_value',
                'own_damage_premium': 'total_own_damage_premium',
                'third_party_premium': 'total_third_party_premium',
                'customer_life_time_value': 'total_customer_lifetime_value'
            }
            for col, data in stats['numeric_sums'].items():
                friendly_name = col_mapping.get(col, col)
                friendly_numeric[friendly_name] = {
                    'total': round(data['total'], 2),
                    'average': round(data['average'], 2)
                }
            summary_stats['numeric_totals'] = friendly_numeric
        
        rows_for_prompt = json.dumps(summary_stats, ensure_ascii=False, default=str)

        opener = _choose_dynamic_opener(question)
        
        # Extract time context ONLY from SQL filters
        time_ctx = _extract_time_context(question, sql or "", rows)
        
        # Build prompt based on whether time context exists
        if time_ctx:
            # User asked for specific time period
            prompt = f"""
You are a precise business analyst with a friendly, human tone.

TASK
- Produce ONE short sentence that MUST start with "{opener}:" and clearly answers the question.
- Include the time context "{time_ctx}" naturally in the sentence using phrasing like "for {time_ctx}" or "in {time_ctx}".
- Then produce 3–{max_bullets} concise bullets with concrete values from the data.
- Each bullet MUST start with "- ".
- Use business-friendly language, no technical column names.
- Use the AGGREGATE STATISTICS provided (total counts, unique counts, sums) - don't just describe the sample records.
- Do not invent numbers. No emojis.

CONTEXT
Question: {question}
Time Period: {time_ctx}

DATA WITH AGGREGATE STATISTICS:
{rows_for_prompt}

OUTPUT FORMAT (Markdown)
1) First line starts with "{opener}:" and includes the time period "{time_ctx}".
2) Then 3–{max_bullets} bullets, each on its own line starting with "- ".
3) Use the aggregate statistics (total_records, unique_counts, numeric_totals) in your bullets.
4) Use natural business language instead of technical terms.

IMPORTANT: 
- MUST use the aggregate statistics like "total_records", "unique_customers", etc.
- MUST mention the time period "{time_ctx}" in the first sentence
- Use business-friendly formatting like "Total: 15,868 policies" or "Unique Customers: 10,234"
- Don't just list sample records - focus on aggregate insights
""".strip()
        else:
            # User did NOT ask for specific time period
            prompt = f"""
You are a precise business analyst with a friendly, human tone.

TASK
- Produce ONE short sentence that MUST start with "{opener}:" and clearly answers the question.
- Do NOT mention any time period since the user didn't ask for one.
- Then produce 3–{max_bullets} concise bullets with concrete values from the data.
- Each bullet MUST start with "- ".
- Use business-friendly language, no technical column names.
- Use the AGGREGATE STATISTICS provided (total counts, unique counts, sums) - don't just describe the sample records.
- Do not invent numbers. No emojis.

CONTEXT
Question: {question}

DATA WITH AGGREGATE STATISTICS:
{rows_for_prompt}

OUTPUT FORMAT (Markdown)
1) First line starts with "{opener}:" - do NOT add any time context.
2) Then 3–{max_bullets} bullets, each on its own line starting with "- ".
3) Use the aggregate statistics (total_records, unique_counts, numeric_totals) in your bullets.
4) Use natural business language instead of technical terms.

IMPORTANT: 
- MUST use the aggregate statistics like "total_records", "unique_customers", etc.
- Do NOT mention time periods since user didn't ask for it
- Use business-friendly formatting like "Total: 15,868 policies" or "Unique Customers: 10,234"
- Don't just list sample records - focus on aggregate insights from ALL data
- Example: "We found 15,868 renewed policies from 8,234 unique customers" (using real aggregate stats)
""".strip()

        llm = get_llama_maverick_llm()
        resp = llm.invoke(prompt)
        text = resp.content if hasattr(resp, "content") else (resp if isinstance(resp, str) else str(resp))
        text = (text or "").strip()
        text = re.sub(r"^\s*\*{0,2}summary:?\*{0,2}\s*", "", text, flags=re.I)

        # Split to lines, keep non-empty
        lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]

        # Build headline (line 1)
        first_line = lines[0] if lines else f"{opener}: concise summary."
        
        # Add time context ONLY if it exists AND wasn't already included by LLM
        if time_ctx and (time_ctx not in first_line):
            if first_line.endswith((".", "!", "?")):
                first_line = first_line[:-1] + f" for {time_ctx}."
            else:
                first_line = first_line + f" for {time_ctx}"

        # Collect/normalize bullets from remaining lines
        bullets = []
        for ln in lines[1:]:
            clean = re.sub(r"^\s*([-\*\u2022]|\d+\.)\s*", "", ln).strip()
            if clean:
                bullets.append(f"- {clean}")

        # Fallback: synthesize bullets from aggregate stats if model didn't return any
        if not bullets:
            bullets = []
            if 'unique_counts' in stats:
                for key, count in list(stats['unique_counts'].items())[:3]:
                    friendly_key = key.replace('_', ' ').title()
                    bullets.append(f"- {friendly_key}: {count:,}")
            
            if not bullets:
                bullets = [f"- Total Records: {stats['total_rows']:,}"]
            
            bullets = bullets[:max_bullets]

        # Cap bullet count
        bullets = bullets[:max_bullets]

        return f"{first_line}\n\n" + "\n".join(bullets)

    except Exception as e:
        print("⚠️ Summary generation failed:", str(e))
        import traceback
        print(traceback.format_exc())
        opener = _choose_dynamic_opener(question)
        tc = _extract_time_context(question, sql or "", rows)
        suffix = f" for {tc}" if tc else ""
        return f"{opener}: summary not available{suffix}.\n\n- A brief error occurred while generating the summary.\n- Please retry or adjust the filters."