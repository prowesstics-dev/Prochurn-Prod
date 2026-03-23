# Fully Dynamic LLM-Generated Human Speech
from .llm_runner.llm_config import get_llama_maverick_llm
import json, re
from typing import Dict, Any, List
from .config import ROUND_PERCENTAGES, ROUND_CURRENCY
print(f"🚨 HUMANIZER LOADED — ROUND_PERCENTAGES={ROUND_PERCENTAGES}, ROUND_CURRENCY={ROUND_CURRENCY}")

NARRATIVE_SCHEMA = {
    "opener": "",
    "insights": [],
    "recommendations": [],
    "next_step": ""
}

# def _to_preview_rows(rows: List[Dict[str, Any]], limit: int = 25) -> List[Dict[str, Any]]:
#     if not isinstance(rows, list):
#         return []
#     return rows[:limit]

def _derive_contextual_metrics(question: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract rich contextual data for the LLM to use in generating dynamic responses"""
    preview = _to_preview_rows(rows, 100)
    
    metrics = {
        "row_count": len(rows),
        "columns": list(preview[0].keys()) if preview else [],
        "has_data": len(rows) > 0,
        "data_size": "small" if len(rows) < 10 else "medium" if len(rows) < 100 else "large",
    }
    
    # Extract actual data patterns for LLM analysis
    if preview:
        # Identify column types dynamically
        column_analysis = {}
        for col in metrics["columns"]:
            sample_values = [r.get(col) for r in preview[:10] if r.get(col) is not None]
            if sample_values:
                # Check if numeric
                numeric_values = []
                for val in sample_values:
                    try:
                        numeric_values.append(float(val))
                    except:
                        break
                
                if len(numeric_values) == len(sample_values):
                    column_analysis[col] = {
                        "type": "numeric",
                        "sample_values": numeric_values[:5],
                        "min": min(numeric_values),
                        "max": max(numeric_values),
                        "sum": sum(numeric_values),
                        "avg": sum(numeric_values) / len(numeric_values)
                    }
                else:
                    # Categorical/text
                    unique_values = list(set(str(v) for v in sample_values))
                    column_analysis[col] = {
                        "type": "categorical",
                        "sample_values": sample_values[:5],
                        "unique_count": len(unique_values),
                        "unique_values": unique_values[:10]
                    }
        
        metrics["column_analysis"] = column_analysis
        
        # Extract top patterns for LLM insight generation
        metrics["data_patterns"] = []
        
        # Find the most interesting numeric patterns
        numeric_cols = [col for col, info in column_analysis.items() if info.get("type") == "numeric"]
        if numeric_cols:
            # Get top values by first numeric column
            main_numeric = numeric_cols[0]
            categorical_cols = [col for col, info in column_analysis.items() if info.get("type") == "categorical"]
            
            if categorical_cols:
                # Create aggregations for LLM to analyze
                aggregations = {}
                for row in preview:
                    cat_val = str(row.get(categorical_cols[0], "Unknown"))
                    num_val = row.get(main_numeric, 0)
                    try:
                        num_val = float(num_val)
                        if cat_val not in aggregations:
                            aggregations[cat_val] = []
                        aggregations[cat_val].append(num_val)
                    except:
                        continue
                
                # Summarize aggregations
                agg_summary = {}
                for cat, values in aggregations.items():
                    if values:
                        agg_summary[cat] = {
                            "count": len(values),
                            "total": sum(values),
                            "avg": sum(values) / len(values),
                            "max": max(values)
                        }
                
                metrics["aggregation_summary"] = dict(sorted(agg_summary.items(), 
                                                           key=lambda x: x[1].get("total", 0), 
                                                           reverse=True)[:10])
    
    return metrics

def _clean_and_extract_json(raw_text: str) -> dict:
    """Robustly extract JSON from LLM response"""
    # Clean the text
    text = (raw_text or "").strip()
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)  # Remove emojis
    
    # Try to find JSON block
    json_patterns = [
        r'\{.*\}',  # Basic JSON
        r'```json\s*(\{.*\})\s*```',  # Markdown code block
        r'```\s*(\{.*\})\s*```',  # Generic code block
    ]
    
    for pattern in json_patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            json_text = match.group(1) if match.groups() else match.group(0)
            try:
                # Clean common JSON issues
                json_text = re.sub(r',\s*}', '}', json_text)
                json_text = re.sub(r',\s*]', ']', json_text)
                return json.loads(json_text)
            except:
                continue
    
    # If no valid JSON found, return empty structure
    return {}

# def calculate_aggregate_stats(rows: list, question: str) -> dict:
#     """Calculate aggregate statistics from full dataset"""
#     if not rows or len(rows) == 0:
#         return {}
    
#     stats = {'total_count': len(rows)}
    
#     try:
#         sample = rows[0]
#         q_lower = question.lower()
        
#         # State distribution
#         if 'state' in sample:
#             from collections import Counter
#             state_counts = Counter(row.get('state') for row in rows if row.get('state'))
#             stats['state_distribution'] = dict(state_counts.most_common(10))
        
#         # Customer segment distribution
#         if 'customer_segment' in sample:
#             from collections import Counter
#             segment_counts = Counter(row.get('customer_segment') for row in rows if row.get('customer_segment'))
#             stats['segment_distribution'] = dict(segment_counts)
        
#         # Monthly distribution
#         if 'policy_end_date_month' in sample:
#             from collections import Counter
#             month_counts = Counter(row.get('policy_end_date_month') for row in rows if row.get('policy_end_date_month'))
#             stats['monthly_distribution'] = dict(sorted(month_counts.items()))
        
#         # Premium stats
#         if 'total_premium_payable' in sample:
#             premiums = [row.get('total_premium_payable') for row in rows 
#                        if isinstance(row.get('total_premium_payable'), (int, float))]
#             if premiums:
#                 stats['premium_stats'] = {
#                     'total': round(sum(premiums), 2),
#                     'average': round(sum(premiums) / len(premiums), 2)
#                 }
        
#         return stats
        
#     except Exception as e:
#         print(f"⚠️ Aggregate stats error: {e}")
#         return stats

def calculate_aggregate_stats(rows: list, question: str) -> dict:
    """Calculate aggregate statistics - handles both raw and grouped data"""
    if not rows or len(rows) == 0:
        return {}
    
    stats = {'total_count': len(rows)}
    
    try:
        sample = rows[0]
        
        # ========================================
        # STEP 1: DETECT IF DATA IS GROUPED
        # ========================================
        # Grouped data has COUNT/SUM columns and small row count
        has_count_col = any('count' in str(k).lower() or 'sum' in str(k).lower() 
                           for k in sample.keys() if isinstance(k, str))
        has_percentage_col = any('percentage' in str(k).lower() or 'rate' in str(k).lower() 
                                for k in sample.keys() if isinstance(k, str))
        
        is_grouped = (has_count_col or has_percentage_col) and len(rows) < 100
        
        # ========================================
        # BRANCH 1: GROUPED DATA (already aggregated)
        # ========================================
        if is_grouped:
            print("📊 Detected grouped data - extracting aggregated values")
            
            # Store raw grouped results
            grouped_results = []
            for row in rows[:20]:  # First 20 groups
                grouped_results.append({k: v for k, v in row.items() if v is not None})
            
            stats['grouped_data'] = grouped_results
            stats['is_grouped'] = True
            
            # Find the COUNT column name (could be 'policy_count', 'count', 'total', etc.)
            count_col_name = next(
                (k for k in sample.keys() if 'count' in str(k).lower() or 'total' in str(k).lower()),
                None
            )
            
            # ----------------------------------------
            # Pattern 1: is_churn breakdown (Renewed vs Not Renewed)
            # ----------------------------------------
            if 'is_churn' in sample and count_col_name:
                churn_breakdown = {}
                total_from_groups = 0
                
                for row in rows:
                    status = row.get('is_churn', 'Unknown')
                    count_value = row.get(count_col_name, 0)
                    
                    if status and count_value:
                        churn_breakdown[status] = count_value
                        total_from_groups += count_value
                
                if churn_breakdown:
                    stats['churn_breakdown'] = churn_breakdown
                    stats['total_count'] = total_from_groups  # Override with actual total
                    print(f"📊 Churn breakdown: {churn_breakdown} (Total: {total_from_groups})")
            
            # ----------------------------------------
            # Pattern 2: State breakdown
            # ----------------------------------------
            elif 'state' in sample and count_col_name:
                state_breakdown = {}
                total_from_groups = 0
                
                for row in rows:
                    state = row.get('state', 'Unknown')
                    count_value = row.get(count_col_name, 0)
                    
                    if state and count_value:
                        state_breakdown[state] = count_value
                        total_from_groups += count_value
                
                if state_breakdown:
                    stats['state_breakdown'] = state_breakdown
                    stats['total_count'] = total_from_groups
                    print(f"📊 State breakdown: {state_breakdown} (Total: {total_from_groups})")
            
            # ----------------------------------------
            # Pattern 3: Customer segment breakdown
            # ----------------------------------------
            elif 'customer_segment' in sample and count_col_name:
                segment_breakdown = {}
                total_from_groups = 0
                
                for row in rows:
                    segment = row.get('customer_segment', 'Unknown')
                    count_value = row.get(count_col_name, 0)
                    
                    if segment and count_value:
                        segment_breakdown[segment] = count_value
                        total_from_groups += count_value
                
                if segment_breakdown:
                    stats['segment_breakdown'] = segment_breakdown
                    stats['total_count'] = total_from_groups
                    print(f"📊 Segment breakdown: {segment_breakdown} (Total: {total_from_groups})")
            
            # ----------------------------------------
            # Fallback: Generic grouped data
            # ----------------------------------------
            else:
                # Just extract total from COUNT column
                total_from_groups = 0
                for row in rows:
                    if count_col_name and row.get(count_col_name):
                        total_from_groups += row.get(count_col_name, 0)
                
                if total_from_groups > 0:
                    stats['total_count'] = total_from_groups
                    print(f"📊 Total from grouped data: {total_from_groups}")
        
        # ========================================
        # BRANCH 2: RAW DATA (individual records)
        # ========================================
        else:
            print("📊 Detected raw data - calculating distributions")
            
            # State distribution (counting individual rows)
            if 'state' in sample:
                from collections import Counter
                state_counts = Counter(row.get('state') for row in rows if row.get('state'))
                stats['state_distribution'] = dict(state_counts.most_common(10))
            
            # Customer segment distribution
            if 'customer_segment' in sample:
                from collections import Counter
                segment_counts = Counter(row.get('customer_segment') for row in rows if row.get('customer_segment'))
                stats['segment_distribution'] = dict(segment_counts)
            
            # Monthly distribution
            if 'policy_end_date_month' in sample:
                from collections import Counter
                month_counts = Counter(row.get('policy_end_date_month') for row in rows if row.get('policy_end_date_month'))
                stats['monthly_distribution'] = dict(sorted(month_counts.items()))
            
            # Premium stats
            if 'total_premium_payable' in sample:
                premiums = [row.get('total_premium_payable') for row in rows 
                           if isinstance(row.get('total_premium_payable'), (int, float))]
                if premiums:
                    stats['premium_stats'] = {
                        'total': round(sum(premiums), 2),
                        'average': round(sum(premiums) / len(premiums), 2)
                    }
        
        return stats
        
    except Exception as e:
        print(f"⚠️ Aggregate stats error: {e}")
        return stats
def safe_generate_narrative(question, sql, rows):
    """
    Safe wrapper: Try fully dynamic humanized narrative first,
    then intelligent LLM fallback, and finally static narration.
    Always avoids negative or apologetic phrasing.
    """
    try:
        # --- 1. Try fully dynamic narrative ---
        return humanize_narrative(
            question=question,
            rows=rows,
            summary="",
            recommendation="",
            sql=sql,
        )

    except Exception as e:
        logger.warning(f"Dynamic narrative generation failed: {e}")
        row_count = len(rows)

        try:
            # --- 2. Intelligent fallback (still uses LLM) ---
            return _generate_intelligent_fallback(
                question, rows, _derive_contextual_metrics(question, rows)
            )

        except Exception as e2:
            logger.error(f"Intelligent fallback also failed: {e2}")

            # --- 3. Static narration (neutral & constructive) ---
            if row_count == 0:
                return {
                    "opener": "This query did not return any matching records under the current filters.",
                    "insights": ["No results are available with the applied filters."],
                    "recommendations": [
                        "Try broadening the filters or adjusting the time period.",
                        "Consider checking another branch or product category."
                    ],
                    "next_step": "Would you like me to expand the scope and re-run the analysis?",
                     "next_steps": [  # ✅ multiple follow-ups
                        "Would you like me to expand the scope and re-run the analysis?",
                        "Do you want me to check for other time periods?",
                        "Shall I look at a different customer segment?"
                    ]
                }
            else:
                return {
                    "opener": f"I analyzed the results from query and here’s what stands out.",
                    "insights": [
                        f"The dataset includes {len(rows[0]) if rows else 0} fields.",
                        "The results align with the filters you applied."
                    ],
                    "recommendations": [
                        "You could segment the results further by branch, product, or customer type.",
                        "It may also be useful to compare this period with a previous one."
                    ],
                    "next_step": "Would you like me to highlight key drivers or trends next?",
                    "next_steps": [  # ✅ multiple follow-ups
                        "Would you like me to highlight key drivers or trends next?",
                        "Do you want me to compare this data with last quarter?",
                        "Shall I identify the top-performing branches or products?"
                    ]
                }




# def generate_dynamic_conversational_opener(question: str, metrics: Dict[str, Any]) -> str:
#     """Use LLM to generate a completely dynamic conversational opener"""
#     llm = get_llama_maverick_llm()
    
#     system_prompt = (
#         "You are a friendly, experienced data analyst. Generate a natural, conversational opener "
#         "that sounds like how you would actually start explaining results to a colleague. "
#         "Be warm, professional, and engaging. NO emojis. 2-3 sentences max. "
#         "Make it feel like natural human speech, not a template."
#     )
    
#     context = {
#         "user_question": question,
#         "data_overview": {
#             "found_records": metrics.get("row_count", 0),
#             "data_size": metrics.get("data_size", "unknown"),
#             "has_results": metrics.get("has_data", False)
#         }
#     }
    
#     user_prompt = (
#         f"Generate a conversational opener for this data analysis situation:\n"
#         f"{json.dumps(context, indent=2)}\n\n"
#         "Respond with ONLY the opener text - no JSON, no formatting, just natural speech."
#     )
    
#     try:
#         opener = llm._call(
#             prompt=user_prompt,
#             system_prompt=system_prompt,
#             temperature=0.7,  # Higher for more variety
#             max_tokens=150,
#         )
        
#         # Clean and return
#         opener = (opener or "").strip().strip('"').strip("'")
#         if len(opener) < 10:  # Fallback if too short
#             if metrics.get("has_data"):
#                 return f"Great question! I've analyzed your data and found some interesting patterns."
#             else:
#                 return "I've looked into your question, and here's what I can tell you."
        
#         return opener
        
#     except Exception as e:
#         print(f"⚠️ Dynamic opener generation failed: {e}")
#         # Minimal fallback
#         return "Let me walk you through what I found in the data."

# Update your generate_dynamic_conversational_opener function commented for limit10 issue
# def generate_dynamic_conversational_opener(question: str, metrics: Dict[str, Any]) -> str:
#     """Use LLM to generate a completely dynamic conversational opener - ALWAYS POSITIVE during loading"""
#     llm = get_llama_maverick_llm()
    
#     # Extract key entities/topics from the question for context
#     question_lower = question.lower().strip()
    
#     # Determine the topic/domain for better context
#     if any(word in question_lower for word in ['churn', 'retention', 'customer', 'policy']):
#         domain = "customer analytics"
#     elif any(word in question_lower for word in ['branch', 'location', 'office']):
#         domain = "branch performance"
#     elif any(word in question_lower for word in ['premium', 'revenue', 'sales']):
#         domain = "revenue analysis"
#     elif any(word in question_lower for word in ['campaign', 'marketing']):
#         domain = "marketing insights"
#     else:
#         domain = "business intelligence"
    
#     system_prompt = (
#         "You are a friendly, experienced data analyst generating an opener BEFORE data analysis is complete. "
#         "This opener shows during loading, so NEVER mention results, findings, or data availability. "
#         "Focus on what you're ABOUT TO DO, not what you found. "
#         "Be warm, professional, and encouraging. NO emojis. 2-3 sentences max. "
#         "CRITICAL: Never say 'no data', 'no records', 'nothing found', or anything negative about results."
#     )
    
#     # For loading phase, don't pass actual results - focus on intent
#     context = {
#         "user_question": question,
#         "analysis_domain": domain,
#         "loading_phase": True  # Key indicator this is pre-results
#     }
    
#     user_prompt = (
#         f"Generate a conversational opener for starting this data analysis:\n"
#         f"{json.dumps(context, indent=2)}\n\n"
#         "This opener shows WHILE loading, so focus on:\n"
#         "- What you're about to analyze\n"
#         "- Your enthusiasm for helping\n"
#         "- The process you'll follow\n\n"
#         "DO NOT mention any results or data availability since analysis hasn't finished yet.\n"
#         "Respond with ONLY the opener text - no JSON, no formatting."
#     )
    
#     try:
#         opener = llm._call(
#             prompt=user_prompt,
#             system_prompt=system_prompt,
#             temperature=0.7,
#             max_tokens=150,
#         )
        
#         # Clean and validate
#         opener = (opener or "").strip().strip('"').strip("'")
        
#         # Filter out any negative phrases that might slip through
#         negative_patterns = [
#             "no data", "no records", "nothing found", "don't have", "aren't any",
#             "not available", "no results", "no information", "bit of a surprise",
#             "unfortunately", "however", "but when I", "found that there"
#         ]
        
#         opener_lower = opener.lower()
#         if any(pattern in opener_lower for pattern in negative_patterns) or len(opener) < 10:
#             # Use positive fallback
#             positive_fallbacks = [
#                 f"Let me analyze your {domain} question and gather the relevant insights for you.",
#                 f"I'm diving into your {domain} data to provide you with comprehensive analysis.",
#                 f"Great question about {domain}! I'm processing your request to deliver detailed insights.",
#                 f"I'm excited to help with your {domain} analysis and will have results for you shortly.",
#                 f"Let me examine your {domain} data thoroughly to give you the best possible insights."
#             ]
#             import random
#             opener = random.choice(positive_fallbacks)
        
#         return opener
        
#     except Exception as e:
#         print(f"⚠️ Dynamic opener generation failed: {e}")
#         # Safe fallback that's always positive
#         return f"I'm analyzing your {domain} question and will have comprehensive insights for you shortly."
# def humanize_narrative(
#     question: str,
#     rows: List[Dict[str, Any]],
#     summary: str,
#     recommendation: str,
#     sql: str,
#     data_window: Dict[str, str] | None = None,
#     model_temperature: float = 0.6,
#     opener: str = None
# ) -> Dict[str, Any]:
#     """
#     Fully dynamic narrative generation - LLM creates all content naturally
#     """
#     llm = get_llama_maverick_llm()
    
#     # Extract rich contextual data
#     metrics = _derive_contextual_metrics(question, rows)
#     preview = _to_preview_rows(rows, 20)
    
#     # Enhanced system prompt for natural human speech
#     system = (
#     "You are a skilled data analyst having a natural conversation with a colleague. "
#     "Explain results warmly and professionally.\n\n"

#     "Important rules:\n"
#     "- NEVER say: 'no records', 'no data', 'nothing to pull', 'bit of a surprise', or anything apologetic/negative.\n"
#     "- If results are empty, simply say: 'This query did not return matching records under the current filters.'\n"
#     "- If results exist, focus only on what was found — start with what you did analyze.\n"
#     "- Always keep the tone constructive and forward-looking.\n"
#     "- NO emojis.\n\n"

#     "Response format (JSON only):\n"
#     "{\n"
#     '  "opener": "Natural 2-3 sentence conversation starter",\n'
#     '  "insights": ["Specific finding 1", "Specific finding 2", ...],\n'
#     '  "recommendations": ["Action item 1", "Action item 2", ...],\n'
#     '  "next_step": "Natural offer for follow-up"\n'
#     "}"
# )


    
#     # Rich context for LLM
#     analysis_context = {
#         "user_question": question,
#         "data_summary": {
#             "total_rows": len(rows),
#             "columns_available": metrics.get("columns", []),
#             "data_patterns": metrics.get("aggregation_summary", {}),
#             "column_insights": metrics.get("column_analysis", {}),
#             "time_period": data_window or {}
#         },
#         "sample_data": preview,
#         "existing_summary": summary,
#         "existing_recommendation": recommendation,
#         "sql_context": "Data was queried from business intelligence database"
#     }
    
#     user_prompt = (
#         "Please analyze this data and create a natural, conversational explanation. "
#         "Write like you're a human analyst talking to a colleague - be specific, insightful, and engaging.\n\n"
#         f"ANALYSIS CONTEXT:\n{json.dumps(analysis_context, ensure_ascii=False, indent=2)}\n\n"
#         "Generate a natural narrative that sounds authentically human. Use the actual data patterns and numbers."
#     )
    
#     try:
#         # Generate with higher temperature for natural variety
#         raw_response = llm._call(
#             prompt=user_prompt,
#             system_prompt=system,
#             temperature=model_temperature,
#             max_tokens=800,
#         )
        
#         # Extract JSON
#         narrative_obj = _clean_and_extract_json(raw_response)
        
#         # Validate structure
#         if not isinstance(narrative_obj, dict) or not narrative_obj:
#             raise ValueError("Invalid or empty response structure")
        
#         # Ensure all required keys exist with natural fallbacks
#         if not narrative_obj.get("opener"):
#             if opener:
#                 narrative_obj["opener"] = opener
#             else:
#                 narrative_obj["opener"] = generate_dynamic_conversational_opener(question, metrics)
        
#         if not isinstance(narrative_obj.get("insights"), list):
#             narrative_obj["insights"] = _generate_dynamic_fallback_insights(question, rows, metrics)
            
#         if not isinstance(narrative_obj.get("recommendations"), list):
#             narrative_obj["recommendations"] = _generate_dynamic_fallback_recommendations(question, rows, metrics)
            
#         if not narrative_obj.get("next_step"):
#             narrative_obj["next_step"] = _generate_dynamic_next_step(question, metrics)
        
#         return narrative_obj
        
#     except Exception as e:
#         print(f"⚠️ Dynamic narrative generation failed: {e}")
#         return _generate_intelligent_fallback(question, rows, metrics, opener)

# def humanize_narrative(
#     question: str,
#     rows: List[Dict[str, Any]],
#     summary: str,
#     recommendation: str,
#     sql: str,
#     data_window: Dict[str, str] | None = None,
#     model_temperature: float = 0.6,
#     opener: str = None,
#     corpus_insights: Dict[str, Any] | None = None   # ✅ NEW
# ) -> Dict[str, Any]:
#     """
#     Fully dynamic narrative generation - LLM creates all content naturally.
#     If corpus insights exist, they will be blended with SQL analysis.
#     """
#     llm = get_llama_maverick_llm()
    
#     # Extract rich contextual data
#     metrics = _derive_contextual_metrics(question, rows)
#     preview = _to_preview_rows(rows, 20)
    
#     # Enhanced system prompt
#     system = (
#         "You are a skilled data analyst having a natural conversation with a colleague. "
#         "Blend curated knowledge (if available) with fresh SQL data. "
#         "Explain results warmly and professionally.\n\n"

#         "Important rules:\n"
#         "- NEVER say: 'no records', 'no data', 'nothing to pull', 'bit of a surprise', or anything apologetic/negative.\n"
#         "- If results are empty, simply say: 'This query did not return matching records under the current filters.'\n"
#         "- If results exist, focus only on what was found — start with what you did analyze.\n"
#         "- Always keep the tone constructive and forward-looking.\n"
#         "- NO emojis.\n\n"

#         "Response format (JSON only):\n"
#         "{\n"
#         '  "opener": "Natural 2-3 sentence conversation starter",\n'
#         '  "insights": ["Specific finding 1", "Specific finding 2", ...],\n'
#         '  "recommendations": ["Action item 1", "Action item 2", ...],\n'
#         '  "next_step": "Natural offer for follow-up"\n'
#         "}"
#     )
    
#     # Build analysis context with both SQL + corpus
#     analysis_context = {
#         "user_question": question,
#         "data_summary": {
#             "total_rows": len(rows),
#             "columns_available": metrics.get("columns", []),
#             "data_patterns": metrics.get("aggregation_summary", {}),
#             "column_insights": metrics.get("column_analysis", {}),
#             "time_period": data_window or {}
#         },
#         "sample_data": preview,
#         "existing_summary": summary,
#         "existing_recommendation": recommendation,
#         "sql_context": sql,
#     }
    
#     # ✅ Blend corpus insights if provided
#     if corpus_insights:
#         analysis_context["corpus_knowledge"] = {
#             "summary": corpus_insights.get("summary"),
#             "recommendations": corpus_insights.get("recommendations", []),
#             "sql_used_before": corpus_insights.get("sql"),
#             "chart_config": corpus_insights.get("chart_config"),
#             "row_count_previous": corpus_insights.get("row_count")
#         }
    
#     user_prompt = (
#         "Please analyze this data and create a natural, conversational explanation. "
#         "Blend any provided corpus knowledge with fresh SQL insights. "
#         "Write like you're a human analyst talking to a colleague.\n\n"
#         f"ANALYSIS CONTEXT:\n{json.dumps(analysis_context, ensure_ascii=False, indent=2)}\n\n"
#         "Generate a natural narrative that sounds authentically human. "
#         "If both corpus and SQL data are present, merge them seamlessly."
#     )
    
#     try:
#         raw_response = llm._call(
#             prompt=user_prompt,
#             system_prompt=system,
#             temperature=model_temperature,
#             max_tokens=800,
#         )
        
#         narrative_obj = _clean_and_extract_json(raw_response)
        
#         if not isinstance(narrative_obj, dict) or not narrative_obj:
#             raise ValueError("Invalid or empty response structure")
        
#         if not narrative_obj.get("opener"):
#             if opener:
#                 narrative_obj["opener"] = opener
#             else:
#                 narrative_obj["opener"] = generate_dynamic_conversational_opener(question, metrics)
        
#         if not isinstance(narrative_obj.get("insights"), list):
#             narrative_obj["insights"] = _generate_dynamic_fallback_insights(question, rows, metrics)
            
#         if not isinstance(narrative_obj.get("recommendations"), list):
#             narrative_obj["recommendations"] = _generate_dynamic_fallback_recommendations(question, rows, metrics)
            
#         if not narrative_obj.get("next_step"):
#             narrative_obj["next_step"] = _generate_dynamic_next_step(question, metrics)
        
#         return narrative_obj
        
#     except Exception as e:
#         print(f"⚠️ Dynamic narrative generation failed: {e}")
#         return _generate_intelligent_fallback(question, rows, metrics, opener)
# Update the system prompt in humanize_narrative function


def _clean_recommendation(recommendation: str) -> str:
    """Remove SQL queries and technical artifacts from recommendations"""
    import re
    
    # Remove SQL code blocks
    recommendation = re.sub(r'```sql.*?```', '', recommendation, flags=re.DOTALL)
    recommendation = re.sub(r'```.*?```', '', recommendation, flags=re.DOTALL)
    
    # Remove "SQL:" headers and everything after
    recommendation = re.split(r'\n*-+\n*SQL:', recommendation)[0]
    
    # Remove lines starting with technical markers
    lines = recommendation.split('\n')
    cleaned_lines = []
    for line in lines:
        if not any(marker in line.lower() for marker in ['select ', 'from ', 'where ', 'join ', 'with ']):
            cleaned_lines.append(line)
    
    # Clean up extra whitespace and asterisks
    result = '\n'.join(cleaned_lines).strip()
    result = re.sub(r'\*+', '', result)  # Remove multiple asterisks
    result = re.sub(r'\n{3,}', '\n\n', result)  # Remove excessive newlines
    
    return result.strip()

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

# Also fix the humanize_narrative function to handle Decimals commented for limit10 issue
# def humanize_narrative(
#     question: str,
#     rows: List[Dict[str, Any]],
#     summary: str,
#     recommendation: str,
#     sql: str,
#     data_window: Dict[str, str] | None = None,
#     model_temperature: float = 0.6,
#     opener: str = None,
#     corpus_insights: Dict[str, Any] | None = None
# ) -> Dict[str, Any]:
#     """
#     Fixed version that handles Decimal types properly
#     """
#     # from your_llm_module import get_llama_maverick_llm  # Import your LLM
#     import json
    
#     llm = get_llama_maverick_llm()
    
#     # ✅ CRITICAL FIX: Convert Decimals BEFORE any processing
#     rows = _convert_decimals_to_float(rows)
    
#     actual_row_count = len(rows) if isinstance(rows, list) else 0
#     row_count_formatted = f"{actual_row_count:,}"
    
#     print(f"📊 Generating narrative for {row_count_formatted} rows")
    
#     # Extract rich contextual data (now Decimals are converted)
#     metrics = _derive_contextual_metrics(question, rows)
#     preview = _to_preview_rows(rows, 3)
    
#     # System prompt (same as before)
#     system = (
#         "You are a skilled data analyst having a natural conversation with a colleague. "
#         "Blend curated knowledge (if available) with fresh SQL data. "
#         "Explain results warmly and professionally.\n\n"

#         f"⚠️ CRITICAL: THE ACTUAL ROW COUNT IS {row_count_formatted}\n"
#         f"YOU MUST USE THIS EXACT NUMBER: {row_count_formatted}\n"
#         f"Sample records shown are for CONTEXT ONLY - DO NOT count them.\n\n"

#         "CRITICAL RULES FOR TONE:\n"
#         "- ABSOLUTELY NEVER use these phrases: 'no records', 'no data', 'nothing to pull', "
#         "'bit of a surprise', 'unfortunately', 'however', 'but when I dug in', 'aren't actually any', "
#         "'don't have any data', 'nothing found', 'no results to show'\n"
#         "- If results are empty, ONLY say: 'This query did not return matching records under the current filters.'\n"
#         "- If results exist, START with what you DID find, never what you didn't find\n"
#         "- Always maintain constructive, forward-looking tone\n"
#         "- NO emojis or apologetic language\n\n"
#         "- NEVER mention SQL queries, filters like IS NOT NULL, or column names. "
#         "- Explain insights in plain business terms (e.g., 'active customers' instead of 'policy_end_date_year IS NOT NULL').\n\n"

#         "Response format (JSON only):\n"
#         "{\n"
#         f'  "opener": "Natural 2-3 sentence conversation starter mentioning {row_count_formatted} (POSITIVE ONLY)",\n'
#         '  "insights": ["Specific finding 1", "Specific finding 2", ...],\n'
#         '  "recommendations": ["Action item 1", "Action item 2", ...],\n'
#         '  "next_steps": ["Follow-up 1", "Follow-up 2", "Follow-up 3"]\n'
#         "}\n\n"
#         f"REMEMBER: You are analyzing {row_count_formatted} total records. Use this number in your opener."
#     )
    
#     # Build analysis context (Decimals already converted)
#     analysis_context = {
#         "user_question": question,
#         "CRITICAL_ACTUAL_ROW_COUNT": actual_row_count,
#         "ROW_COUNT_FORMATTED": row_count_formatted,
#         "data_summary": {
#             "total_rows": actual_row_count,
#             "columns_available": metrics.get("columns", []),
#             "data_patterns": metrics.get("aggregation_summary", {}),
#             "column_insights": metrics.get("column_analysis", {}),
#             "time_period": data_window or {}
#         },
#         "sample_data_for_context_only": preview,
#         "existing_summary": summary,
#         "existing_recommendation": recommendation,
#         "sql_context": "Technical query used (hidden from narrative output).",
#     }
    
#     if corpus_insights:
#         analysis_context["corpus_knowledge"] = {
#             "summary": corpus_insights.get("summary"),
#             "recommendations": corpus_insights.get("recommendations", []),
#             "sql_used_before": corpus_insights.get("sql"),
#             "chart_config": corpus_insights.get("chart_config"),
#             "row_count_previous": corpus_insights.get("row_count")
#         }
    
#     user_prompt = (
#         f"⚠️ CRITICAL REMINDER: You are analyzing {row_count_formatted} total records.\n"
#         f"The sample_data_for_context_only shows only 3 examples - DO NOT count these.\n"
#         f"You MUST mention {row_count_formatted} in your opener.\n\n"
        
#         "⚠️ DO NOT GENERATE INSIGHTS ABOUT:\n"
#         "- 'Unique values' or 'distinct values' counts (e.g., '10 unique customers')\n"
#         "- Customer IDs, Policy numbers, or other identifier ranges\n"
#         "- Data structure details (columns, fields, data types)\n"
#         "- Technical SQL details\n\n"
        
#         "✅ DO GENERATE INSIGHTS ABOUT:\n"
#         "- Business patterns and trends you see in the data\n"
#         "- Comparisons between segments, regions, time periods\n"
#         "- Notable findings that would help business decisions\n"
#         "- Distribution of customers, revenue, policies across categories\n\n"
        
#         "Please analyze this data and create a natural, conversational explanation. "
#         "Blend any provided corpus knowledge with fresh SQL insights. "
#         "Write like you're a human analyst talking to a colleague.\n\n"
        
#         "TONE REQUIREMENTS:\n"
#         "- Be constructive and solution-focused\n"
#         "- If no data found, suggest broadening scope rather than dwelling on the lack of results\n"
#         "- Focus on what CAN be done, not what couldn't be found\n\n"
        
#         f"ANALYSIS CONTEXT:\n{json.dumps(analysis_context, ensure_ascii=False, indent=2)}\n\n"
        
#         "Generate a natural narrative that sounds authentically human. "
#         "DO NOT mention SQL, filters, table names, column names, or technical query details. "
#         "Focus ONLY on customer/business insights and recommendations.\n\n"
        
#         f"START YOUR OPENER WITH: 'We've identified {row_count_formatted}' or similar phrasing using {row_count_formatted}."
#     )
    
#     try:
#         raw_response = llm._call(
#             prompt=user_prompt,
#             system_prompt=system,
#             temperature=model_temperature,
#             max_tokens=800,
#         )
        
#         narrative_obj = _clean_and_extract_json(raw_response)
        
#         if not isinstance(narrative_obj, dict) or not narrative_obj:
#             raise ValueError("Invalid or empty response structure")
        
#         # Validation (same as before)
#         if not narrative_obj.get("opener"):
#             narrative_obj["opener"] = opener or _generate_corrected_opener(
#                 question, actual_row_count, row_count_formatted, data_window
#             )
        
#         if not isinstance(narrative_obj.get("insights"), list):
#             narrative_obj["insights"] = _generate_dynamic_fallback_insights(question, rows, metrics)
            
#         if not isinstance(narrative_obj.get("recommendations"), list):
#             narrative_obj["recommendations"] = _generate_dynamic_fallback_recommendations(question, rows, metrics)
            
#         if not narrative_obj.get("next_steps"):
#             narrative_obj["next_steps"] = _generate_dynamic_next_steps(question, metrics)
        
#         return narrative_obj
        
#     except Exception as e:
#         print(f"⚠️ Dynamic narrative generation failed: {e}")
#         return _generate_intelligent_fallback(
#             question, rows, metrics, opener, actual_row_count, row_count_formatted
#         )





def _generate_corrected_opener(question: str, actual_count: int, formatted_count: str = None, data_window: Dict = None) -> str:
    """
    Generate a corrected opener with the EXACT count - NO ROUNDING
    
    ✅ CRITICAL FIX: Always use actual_count directly, never trust formatted_count
    """
    
    # ✅ FIX: Format the count here with EXACT value - ignore any pre-formatted input
    exact_count_formatted = f"{actual_count:,}"
    
    print(f"🔢 OPENER: actual_count={actual_count} → exact_formatted={exact_count_formatted}")
    
    # Extract key terms from question
    question_lower = question.lower()
    
    # Determine what we're talking about
    subject = "records"
    if "vehicle" in question_lower or "car" in question_lower:
        subject = "vehicle insurance policies" if actual_count != 1 else "vehicle insurance policy"
    elif "polic" in question_lower:
        subject = "policies" if actual_count != 1 else "policy"
    elif "customer" in question_lower or "client" in question_lower:
        subject = "customers" if actual_count != 1 else "customer"
    elif "churn" in question_lower and "segment" in question_lower:
        subject = "segments"
    elif "churn" in question_lower:
        subject = "categories"
    
    # Extract time context from data_window or question
    time_context = ""
    if data_window:
        if "month" in str(data_window).lower():
            time_context = " " + str(data_window.get("month", ""))
        elif "year" in str(data_window).lower():
            time_context = " " + str(data_window.get("year", ""))
    
    if not time_context:
        # Try to extract from question
        import re
        time_patterns = [
            r'in\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}',
            r'in\s+\d{4}',
            r'for\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*',
            r'expiring\s+in\s+(\w+\s+\d{4})',
        ]
        for pattern in time_patterns:
            match = re.search(pattern, question_lower)
            if match:
                time_context = " " + match.group(0).replace("in ", "").replace("for ", "")
                break
    
    # ✅ FIX: Use exact_count_formatted everywhere instead of formatted_count
    
    # For very small counts (1-5), use simpler language
    if actual_count <= 5:
        if actual_count == 1:
            opener = f"I found {actual_count} {subject}"
        else:
            opener = f"I found {exact_count_formatted} {subject}"  # ✅ FIXED
        
        if time_context:
            opener += f"{time_context}"
        
        # Add appropriate ending based on question type
        if "churn" in question_lower or "segment" in question_lower or "breakdown" in question_lower:
            opener += " in the breakdown."
        elif "expir" in question_lower:
            opener += " matching your criteria."
        else:
            opener += "."
    
    # For medium counts (6-100), use "identified"
    elif actual_count <= 100:
        opener = f"We've identified {exact_count_formatted} {subject}"  # ✅ FIXED
        if time_context:
            opener += f"{time_context}"
        opener += ". Here's what the analysis reveals."
    
    # For large counts (100+), emphasize scale and action
    else:
        opener = f"We've identified {exact_count_formatted} {subject}"  # ✅ FIXED
        if time_context:
            opener += f"{time_context}"
        
        # Add context-appropriate ending
        if "expir" in question_lower:
            opener += ". Let's review the details to proactively engage with these customers."
        elif "churn" in question_lower:
            opener += ". This represents a significant opportunity for retention efforts."
        else:
            opener += ". Here's what the data reveals."
    
    print(f"✅ Generated corrected opener: {opener}")
    return opener


def generate_yes_no_opener(question: str, count: int) -> str:
    """
    Generate yes/no opener with EXACT count - NO ROUNDING
    """
    # ✅ FIX: Format with exact count
    exact_count_formatted = f"{count:,}"
    
    print(f"🔢 YES/NO OPENER: count={count} → formatted={exact_count_formatted}")
    
    if count > 0:
        return f"Yes, I found {exact_count_formatted} matching records."
    else:
        return "No, there are no records matching that criteria."

## Newly added on 16th feb
ROUND_PERCENTAGES = True
def _normalize_percentage_columns(rows: list) -> list:
    """
    Auto-detect percentage columns (values between 0 and 1)
    and convert them to XX% format.
    
    Example: 0.6106 → 61
    """
    if not rows or not isinstance(rows, list):
        return rows
    
    # Identify which columns are likely percentages
    percentage_cols = []
    sample = rows[0] if rows else {}
    
    for col, val in sample.items():
        col_lower = col.lower()
        
        # Check by column name
        is_pct_col = any(keyword in col_lower for keyword in [
            'rate', 'ratio', 'pct', 'percent', 'churn', 
            'retention', 'conversion', 'loss'
        ])
        
        # Check by value range (0 to 1)
        is_small_decimal = isinstance(val, float) and 0 < val < 1
        
        if is_pct_col and is_small_decimal:
            percentage_cols.append(col)
    
    if not percentage_cols:
        return rows  # Nothing to convert
    
    # Convert all identified columns
    normalized = []
    for row in rows:
        new_row = dict(row)
        for col in percentage_cols:
            if col in new_row and isinstance(new_row[col], (int, float)):
                if ROUND_PERCENTAGES:# ✅ Config check
                    new_row[col] = round(new_row[col] * 100)
                else:
                    new_row[col] = round(new_row[col] * 100, 2)
        normalized.append(new_row)
    
    return normalized


def humanize_narrative(
    question: str,
    rows: List[Dict[str, Any]],
    summary: str,
    recommendation: str,
    sql: str,
    data_window: Dict[str, str] | None = None,
    model_temperature: float = 0.6,
    opener: str = None,  # ✅ CRITICAL: This should be pre-generated!
    corpus_insights: Dict[str, Any] | None = None
) -> Dict[str, Any]:
    """
    Fixed version - MUST use pre-generated opener, never regenerate it
    """
    import json
    import re
    
    llm = get_llama_maverick_llm()

    # In the main humanize_narrative function, after the LLM call:

    
    
    # Convert Decimals BEFORE processing
    # rows = _convert_decimals_to_float(rows)
    rows = _normalize_percentage_columns(rows)  
    
    # Classify result type and extract business count
    result_type = classify_result_type(rows)
    row_len = len(rows) if isinstance(rows, list) else 0
    business_count = extract_business_count(rows, result_type)
    display_count = business_count if business_count is not None else row_len
    row_count_formatted = f"{display_count:,}"
    
    print(f"📊 Generating narrative for {row_count_formatted} ({result_type})")

     # ✅ CRITICAL: Handle ZERO RESULTS immediately
    if display_count == 0:
        entity_name = _get_business_entity_name(question, result_type, rows)
        return {
            # "opener": f"No {entity_name} were found matching your criteria.",
            "opener": [],
            "insights": [],
            "recommendations": [],
            "next_steps": []
        }
    
    # ✅ Validate opener
    if not opener or len(opener.strip()) < 10:
        opener = _generate_smart_fallback_opener(question, result_type, display_count, rows)
    
    # ✅ Fix bad openers mentioning records
    if result_type in ["GROUPED_METRIC", "SINGLE_METRIC"]:
        if any(p in opener.lower() for p in ["records", "rows"]):
            opener = _generate_smart_fallback_opener(question, result_type, display_count, rows)
    
    is_yn_question = is_yes_no_question(question)
    
    if is_yn_question:
        yn_count = business_count if business_count is not None else row_len
        opener = generate_yes_no_opener(question, yn_count)
    
    metrics = _derive_contextual_metrics(question, rows)
    preview = _to_preview_rows(rows, 3)
    aggregate_stats = calculate_aggregate_stats(rows, question)
    print(f"📊 Aggregate stats calculated: {list(aggregate_stats.keys())}")
    # 🔥 DETECT SINGLE ROW + SINGLE COLUMN
    if rows and isinstance(rows[0], dict) and len(rows) == 1 and len(rows[0]) == 1:
        is_single_value = True
    else:
        is_single_value = False
    # 🔥 FORCE OPENER FOR SINGLE VALUE
    if is_single_value:
        col = list(rows[0].keys())[0]
        value = list(rows[0].values())[0]

        col_clean = col.replace("_", " ")
        col_lower = col.lower()
        if any(k in col_lower for k in ["percent", "rate", "ratio", "pct"]):
            opener = f"The {col_clean} is {value}%."
        else:
            opener = f"The {col_clean} is {value:,}."


    # ==========================================================
    # 🔧 SYSTEM PROMPT (FIXED — NO META, NO PREAMBLE)
    # ==========================================================
    if is_yn_question:
        system = f"""
You are generating structured JSON output for a production system.

STRICT OUTPUT RULES:
- Return ONLY valid JSON
- No explanations or preamble
- No emojis
- No apologies
- No references to SQL, rows, records, or columns

CRITICAL:
- The opener is pre-generated
- Copy it EXACTLY
- Do NOT explain or rephrase it

OUTPUT FORMAT:
{{
  "opener": "{opener}",
  "insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Recommendation 1"],
  "next_steps": ["Follow-up question 1"]
}}
"""
    else:
        system = f"""
You are generating structured JSON output for a production system.

STRICT OUTPUT RULES:
- Return ONLY valid JSON
- No explanations, framing text, or preamble
- Do NOT say "Here is", "Here's", or similar
- No emojis or apologies
- No SQL or technical references

CRITICAL DATA RULE:
- If aggregate_stats exists, you MUST ignore sample_data completely.
- Never reference preview rows or sample rows.
- All numerical insights must come only from aggregate_stats.

CRITICAL:
- The opener is pre-generated
- Copy it EXACTLY
- Do NOT modify or explain it

OUTPUT FORMAT:
{{
  "opener": "{opener}",
  "insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "next_steps": ["Follow-up question 1", "Follow-up question 2"]
}}
"""

#     # ==========================================================
#     # 🔧 USER PROMPT (FIXED — HARD GUARD)
#     # ==========================================================
#     user_prompt = f"""
# COPY THIS OPENER EXACTLY — CHARACTER FOR CHARACTER:
# "{opener}"

# DO NOT:
# - Add any text before or after JSON
# - Explain the opener
# - Say "Here is" or similar

# ANALYSIS CONTEXT:
# {json.dumps({
#     "question": question,
#     "result_type": result_type,
#     "display_count": row_count_formatted,
#     "metrics": metrics,
#     "sample_data": preview,
#     "data_window": data_window or {}
# }, ensure_ascii=False, indent=2)}
# """

#     try:
#         raw_response = llm._call(
#             prompt=user_prompt,
#             system_prompt=system,
#             temperature=model_temperature,
#             max_tokens=700,
#         )
        
#         narrative_obj = _clean_and_extract_json(raw_response)
#         if not isinstance(narrative_obj, dict):
#             raise ValueError("Invalid JSON")

#         # ✅ FORCE opener
#         narrative_obj["opener"] = opener.strip()

#         # ✅ Final safety strip
#         narrative_obj["opener"] = narrative_obj["opener"].split("\n")[0].strip()

#         if not narrative_obj.get("insights"):
#             narrative_obj["insights"] = _generate_dynamic_fallback_insights(question, rows, metrics)

#         if not narrative_obj.get("recommendations"):
#             narrative_obj["recommendations"] = _generate_dynamic_fallback_recommendations(question, rows, metrics)

#         if not narrative_obj.get("next_steps"):
#             narrative_obj["next_steps"] = _generate_dynamic_next_steps(question, metrics)

#         return narrative_obj

#     except Exception as e:
#         print(f"⚠️ Narrative generation failed: {e}")
#         return {
#             "opener": opener,
#             "insights": [],
#             "recommendations": [],
#             "next_steps": []
#         }


    # ==========================================================
    # 🔧 USER PROMPT (FIXED — HARD GUARD)
    # ==========================================================
    pct_instruction = (
        "- ALWAYS round percentages to nearest WHOLE number (e.g., 61.06% → 61%, 88.96% → 89%, 64.95% → 65%)\n"
        "- Never show decimals for percentage values\n"
        "- Never say '0.61' — always say '61%'"
    ) if ROUND_PERCENTAGES else (
        "- Show percentages with 2 decimal places (e.g., 61.06%, 88.96%)\n"
        "- Never say '0.61' — always say '61.06%'"
    )

    user_prompt = f"""
COPY THIS OPENER EXACTLY — CHARACTER FOR CHARACTER:
"{opener}"

DO NOT:
- Add any text before or after JSON
- Explain the opener
- Say "Here is" or similar

IMPORTANT — NUMBER FORMATTING RULES:
- Any value that looks like a churn rate or percentage is already in % form
- Always append "%" when mentioning such values in insights

🚨 STRICT DATA USAGE RULE:
- You are strictly forbidden from using sample_data for generating insights.
- Only use aggregate_stats for all numerical and analytical conclusions.

{pct_instruction}

CRITICAL — USE AGGREGATE DATA:
You have access to aggregate_stats which contains FULL DATASET statistics.
ALWAYS use aggregate_stats for insights, NOT sample_data (only 3 rows).

Rules:
- total_count → Use for "X records found"
- state_distribution → Use for state-wise breakdown
- segment_distribution → Use for segment analysis
- monthly_distribution → Use for time patterns
- premium_stats → Use for financial metrics

Example: If aggregate_stats has {{"total_count": 46, "state_distribution": {{"ML": 1}}}},
say "Total 46 records with ML having 1 record" NOT "Sample shows..."


ANALYSIS CONTEXT:
{json.dumps({
    "question": question,
    "result_type": result_type,
    "display_count": row_count_formatted,
    "metrics": metrics,
    "aggregate_stats": aggregate_stats,
    "data_window": data_window or {}    
}, ensure_ascii=False, indent=2)}
"""

    try:
        raw_response = llm._call(
            prompt=user_prompt,
            system_prompt=system,
            # temperature=model_temperature,
            max_tokens=700,
        )
        
        narrative_obj = _clean_and_extract_json(raw_response)
        # 🔥 REMOVE INSIGHTS FOR SINGLE VALUE
        if is_single_value:
            narrative_obj["insights"] = []
        if not isinstance(narrative_obj, dict):
            raise ValueError("Invalid JSON")

        # ✅ FORCE opener
        narrative_obj["opener"] = opener.strip()

        # ✅ Final safety strip
        narrative_obj["opener"] = narrative_obj["opener"].split("\n")[0].strip()

        # if not narrative_obj.get("insights"):
        #     narrative_obj["insights"] = _generate_dynamic_fallback_insights(question, rows, metrics)

        # if not narrative_obj.get("recommendations"):
        #     narrative_obj["recommendations"] = _generate_dynamic_fallback_recommendations(question, rows, metrics)

        # if not narrative_obj.get("next_steps"):
        #     narrative_obj["next_steps"] = _generate_dynamic_next_steps(question, metrics)
        # print(f"🚨 USER PROMPT PCT INSTRUCTION: {pct_instruction}")
        # return narrative_obj
                # if not narrative_obj.get("insights"):
        #     narrative_obj["insights"] = _generate_dynamic_fallback_insights(question, rows, metrics)
        # 🔥 Deterministic GROUPED_METRIC insights
        if aggregate_stats.get("state_distribution"):
            top_state = max(
                aggregate_stats["state_distribution"],
                key=aggregate_stats["state_distribution"].get
            )

            narrative_obj["insights"] = [
                f"{top_state} contributes the highest share among all states.",
                f"The total volume stands at {display_count:,}."
            ]

        # 🔥 Otherwise fallback to LLM
        elif not narrative_obj.get("insights") and not is_single_value:
            narrative_obj["insights"] = _generate_dynamic_fallback_insights(question, rows, metrics)

        if not narrative_obj.get("recommendations"):
            narrative_obj["recommendations"] = _generate_dynamic_fallback_recommendations(question, rows, metrics)

        if not narrative_obj.get("next_steps"):
            narrative_obj["next_steps"] = _generate_dynamic_next_steps(question, metrics)
        print(f"🚨 USER PROMPT PCT INSTRUCTION: {pct_instruction}")
        return narrative_obj

    except Exception as e:
        print(f"⚠️ Narrative generation failed: {e}")
        return {
            "opener": opener,
            "insights": [],
            "recommendations": [],
            "next_steps": []
        }



# def humanize_narrative(
#     question: str,
#     rows: List[Dict[str, Any]],
#     summary: str,
#     recommendation: str,
#     sql: str,
#     data_window: Dict[str, str] | None = None,
#     model_temperature: float = 0.6,
#     opener: str = None,  # ✅ CRITICAL: This should be pre-generated!
#     corpus_insights: Dict[str, Any] | None = None
# ) -> Dict[str, Any]:
#     """
#     Fixed version - MUST use pre-generated opener, never regenerate it
#     """
#     import json
    
#     llm = get_llama_maverick_llm()
    
#     # Convert Decimals BEFORE processing
#     rows = _convert_decimals_to_float(rows)
    
#     # Classify result type and extract business count
#     result_type = classify_result_type(rows)
#     row_len = len(rows) if isinstance(rows, list) else 0
#     business_count = extract_business_count(rows, result_type)
#     display_count = business_count if business_count is not None else row_len
#     row_count_formatted = f"{display_count:,}"
    
#     print(f"📊 Generating narrative for {row_count_formatted} ({result_type})")
    
#     # ✅ CRITICAL: Validate opener exists and is good quality
#     if not opener or len(opener.strip()) < 10:
#         print(f"⚠️ WARNING: No valid opener provided, generating emergency fallback")
#         opener = _generate_smart_fallback_opener(question, result_type, display_count, rows)
    
#     # ✅ CRITICAL: Reject bad openers that mention "records" for grouped data
#     if result_type in ["GROUPED_METRIC", "SINGLE_METRIC"]:
#         if any(phrase in opener.lower() for phrase in [
#             f"{row_len} records",
#             f"{display_count} records",
#             "records related to",
#             "records matching"
#         ]):
#             print(f"⚠️ WARNING: Opener mentions 'records' for {result_type}, fixing...")
#             opener = _generate_smart_fallback_opener(question, result_type, display_count, rows)
    
#     # Check if this is a yes/no question
#     is_yn_question = is_yes_no_question(question)
    
#     # For yes/no questions, use direct opener
#     if is_yn_question:
#         yn_count = business_count if business_count is not None else row_len
#         opener = generate_yes_no_opener(question, yn_count)
    
#     # Extract metrics
#     metrics = _derive_contextual_metrics(question, rows)
#     preview = _to_preview_rows(rows, 3)
    
#     # Adjust system prompt based on question type
#     if is_yn_question:
#         system = (
#             "You are a skilled data analyst providing direct answers to yes/no questions. "
#             f"The question asked for a yes/no answer and the result count is {row_count_formatted}.\n\n"
#             f"⚠️ CRITICAL: THE ACTUAL COUNT IS {row_count_formatted}\n"
#             f"This is a YES/NO question. Your opener has already stated YES or NO.\n"
#             f"Now provide supporting insights and recommendations.\n\n"
#             "Response format (JSON only):\n"
#             "{\n"
#             f'  "opener": "{opener}",\n'
#             '  "insights": ["Supporting detail 1", "Supporting detail 2"],\n'
#             '  "recommendations": ["What to do with this information"],\n'
#             '  "next_steps": ["Follow-up question 1", "Follow-up question 2"]\n'
#             "}\n\n"
#             "NO emojis. Be professional and concise."
#         )
#     else:
#         system = (
#             "You are a skilled data analyst having a natural conversation with a colleague. "
#             "Blend curated knowledge (if available) with fresh SQL data. "
#             "Explain results warmly and professionally.\n\n"
#             f"⚠️ CRITICAL CONTEXT:\n"
#             f"- Result type: {result_type}\n"
#             f"- Display count: {row_count_formatted}\n"
#             f"- The opener has ALREADY been generated and validated\n"
#             f"- DO NOT regenerate or modify the opener\n"
#             f"- Focus on generating insights and recommendations\n\n"
#             "CRITICAL RULES FOR TONE:\n"
#             "- NEVER use phrases like: 'no records', 'no data', 'nothing to pull', "
#             "'bit of a surprise', 'unfortunately', 'however', 'but when I dug in'\n"
#             "- If results are empty, ONLY say: 'This query did not return matching records.'\n"
#             "- If results exist, START with what you DID find\n"
#             "- Always maintain constructive, forward-looking tone\n"
#             "- NO emojis or apologetic language\n"
#             "- NEVER mention SQL queries, filters, or column names\n\n"
#             "Response format (JSON only):\n"
#             "{\n"
#             f'  "opener": "{opener}",\n'
#             '  "insights": ["Business insight 1", "Business insight 2", ...],\n'
#             '  "recommendations": ["Action item 1", "Action item 2", ...],\n'
#             '  "next_steps": ["Follow-up 1", "Follow-up 2", "Follow-up 3"]\n'
#             "}\n\n"
#             f"⚠️ USE EXACTLY THIS OPENER: \"{opener}\"\n"
#             "DO NOT modify or regenerate it."
#         )
    
#     # Build analysis context
#     analysis_context = {
#         "user_question": question,
#         "is_yes_no_question": is_yn_question,
#         "result_type": result_type,
#         "ROW_COUNT_FORMATTED": row_count_formatted,
#         "data_summary": {
#             "total_rows": row_len,
#             "display_count": display_count,
#             "columns_available": metrics.get("columns", []),
#             "data_patterns": metrics.get("aggregation_summary", {}),
#             "column_insights": metrics.get("column_analysis", {}),
#             "time_period": data_window or {}
#         },
#         "sample_data_for_context_only": preview,
#         "existing_summary": summary,
#         "existing_recommendation": recommendation,
#     }
    
#     if corpus_insights:
#         analysis_context["corpus_knowledge"] = {
#             "summary": corpus_insights.get("summary"),
#             "recommendations": corpus_insights.get("recommendations", []),
#             "sql_used_before": corpus_insights.get("sql"),
#             "chart_config": corpus_insights.get("chart_config"),
#             "row_count_previous": corpus_insights.get("row_count")
#         }
    
#     user_prompt = (
#         f"⚠️ CRITICAL INSTRUCTIONS:\n"
#         f"1. You MUST use this EXACT opener (copy it character-by-character):\n"
#         f'   "{opener}"\n\n'
#         f"2. DO NOT add any preamble like 'Here is...' or 'Here's...'\n"
#         f"3. DO NOT add commentary about generating the opener\n"
#         f"4. Just return the JSON with this exact opener string\n\n"
#     )
    
#     if is_yn_question:
#         user_prompt += (
#             f"This is a YES/NO question. The answer is in the opener.\n"
#             f"Now provide 2-3 supporting insights and actionable recommendations.\n\n"
#         )
#     else:
#         user_prompt += (
#             f"Generate insights and recommendations based on the analysis.\n"
#             f"Result type: {result_type}\n"
#             f"Display count: {row_count_formatted}\n\n"
#         )
    
#     user_prompt += (
#         "⚠️ DO NOT GENERATE INSIGHTS ABOUT:\n"
#         "- 'Unique values' or 'distinct values' counts\n"
#         "- Customer IDs, Policy numbers, or identifier ranges\n"
#         "- Data structure details (columns, fields, data types)\n"
#         "- Technical SQL details\n\n"
#         "✅ DO GENERATE INSIGHTS ABOUT:\n"
#         "- Business patterns and trends in the data\n"
#         "- Comparisons between segments, regions, time periods\n"
#         "- Notable findings that help business decisions\n"
#         "- Distribution across categories\n\n"
#         f"ANALYSIS CONTEXT:\n{json.dumps(analysis_context, ensure_ascii=False, indent=2)}\n\n"
#         "Generate insights and recommendations. "
#         "DO NOT mention SQL, filters, table names, or column names."
#     )
    
#     try:
#         raw_response = llm._call(
#             prompt=user_prompt,
#             system_prompt=system,
#             temperature=model_temperature,
#             max_tokens=800,
#         )
        
#         narrative_obj = _clean_and_extract_json(raw_response)
        
#         if not isinstance(narrative_obj, dict) or not narrative_obj:
#             raise ValueError("Invalid or empty response structure")
        
#         # ✅ FORCE the pre-generated opener (override whatever LLM returned)
#         narrative_obj["opener"] = opener
        
#         # ✅ Additional cleanup: remove any preamble text from opener if LLM ignored instructions
#         if narrative_obj.get("opener") and isinstance(narrative_obj["opener"], str):
#             opener_text = narrative_obj["opener"]
#             # Remove common preamble patterns
#             preamble_patterns = [
#                 r"^Here's a professional.*?:\s*\n*",
#                 r"^Here is a professional.*?:\s*\n*",
#                 r"^Here's an? .*?:\s*\n*",
#                 r"^Here is an? .*?:\s*\n*",
#                 r'^".*?query:\s*\n*',
#             ]
#             for pattern in preamble_patterns:
#                 opener_text = re.sub(pattern, "", opener_text, flags=re.IGNORECASE)
            
#             # Clean up quotes and whitespace
#             opener_text = opener_text.strip().strip('"').strip("'").strip()
#             narrative_obj["opener"] = opener_text
        
#         # ✅ Final safety: if opener is still wrong, force our pre-generated one
#         if not narrative_obj.get("opener") or len(narrative_obj["opener"]) < 10:
#             print(f"⚠️ LLM generated invalid opener, forcing pre-generated one")
#             narrative_obj["opener"] = opener
        
#         # Validate insights
#         if not isinstance(narrative_obj.get("insights"), list) or not narrative_obj["insights"]:
#             narrative_obj["insights"] = _generate_dynamic_fallback_insights(question, rows, metrics)
        
#         # Validate recommendations
#         if not isinstance(narrative_obj.get("recommendations"), list) or not narrative_obj["recommendations"]:
#             narrative_obj["recommendations"] = _generate_dynamic_fallback_recommendations(question, rows, metrics)
        
#         # Validate next_steps
#         if not narrative_obj.get("next_steps"):
#             narrative_obj["next_steps"] = _generate_dynamic_next_steps(question, metrics)
        
#         return narrative_obj
        
#     except Exception as e:
#         print(f"⚠️ Dynamic narrative generation failed: {e}")
        
#         # Fallback with yes/no support
#         if is_yn_question:
#             return {
#                 "opener": opener,
#                 "insights": [f"We found {row_count_formatted} matching records in our database."],
#                 "recommendations": ["Consider analyzing these records in more detail."],
#                 "next_steps": ["Would you like to see specific details about these records?"]
#             }
        
#         return _generate_intelligent_fallback(
#             question, rows, metrics, opener, display_count, row_count_formatted
#         )




def _get_business_entity_name(question: str, result_type: str, rows: list = None) -> str:
    """Determine what business entity the data represents"""
    q_lower = question.lower()
    
    # For grouped data, interpret the grouping dimension
    if result_type in ["GROUPED_METRIC", "SINGLE_METRIC"]:
        if any(word in q_lower for word in ["by tenure", "tenure", "duration"]):
            return "tenure segments"
        elif any(word in q_lower for word in ["by state", "state", "geographic"]):
            return "states"
        elif any(word in q_lower for word in ["by quarter", "quarter", "quarterly"]):
            return "quarters"
        elif any(word in q_lower for word in ["by month", "month", "monthly"]):
            return "months"
        elif any(word in q_lower for word in ["by product", "product type"]):
            return "product categories"
        elif any(word in q_lower for word in ["by branch", "branch"]):
            return "branches"
        elif any(word in q_lower for word in ["by customer", "customer segment"]):
            return "customer segments"
        else:
            # Try to infer from data columns
            if rows and len(rows) > 0 and isinstance(rows[0], dict):
                cols = [c.lower() for c in rows[0].keys()]
                if any("state" in c for c in cols):
                    return "states"
                elif any("month" in c or "quarter" in c for c in cols):
                    return "time periods"
                elif any("type" in c or "category" in c for c in cols):
                    return "categories"
                elif any("tenure" in c or "duration" in c for c in cols):
                    return "tenure segments"
            return "segments"
    
    # For row-level data
    if "customer" in q_lower:
        return "customers"
    elif "policy" in q_lower or "policies" in q_lower:
        return "policies"
    elif "claim" in q_lower:
        return "claims"
    elif "branch" in q_lower:
        return "branches"
    elif "transaction" in q_lower:
        return "transactions"
    else:
        return "records"


# ============================================================
# FIX 1: YES/NO QUESTION DETECTION
# ============================================================

# def is_yes_no_question(question: str) -> bool:
#     """Detect if question expects a yes/no answer"""
#     q = question.lower().strip()
    
#     # Direct yes/no patterns
#     yes_no_patterns = [
#         r'^is there\b',
#         r'^are there\b',
#         r'^do we have\b',
#         r'^does\b',
#         r'^is\b',
#         r'^are\b',
#         r'^can\b',
#         r'^did\b',
#         r'^was\b',
#         r'^were\b',
#         r'^has\b',
#         r'^have\b',
#         r'^will\b',
#         r'^would\b',
#         r'^should\b',
#     ]
    
#     for pattern in yes_no_patterns:
#         if re.search(pattern, q):
#             return True
    
#     return False


# def generate_yes_no_opener(question: str, row_count: int) -> str:
#     """Generate appropriate opener for yes/no questions based on actual results"""
#     q = question.lower()
    
#     # Extract the subject from question
#     if "renewed customer" in q:
#         subject = "renewed customers"
#     elif "churn" in q:
#         subject = "churned customers"
#     elif "claim" in q:
#         subject = "claims"
#     elif "policy" in q or "policies" in q:
#         subject = "policies"
#     elif "branch" in q:
#         subject = "branches"
#     elif "customer" in q:
#         subject = "customers"
#     else:
#         subject = "records"
    
#     # Extract time context
#     year_match = re.search(r'\b(20\d{2})\b', question)
#     time_context = f"for {year_match.group(1)}" if year_match else ""
    
#     if row_count > 0:
#         return f"Yes, we found {row_count:,} {subject} {time_context}."
#     else:
#         return f"No, there are no {subject} {time_context} in our records."


def generate_conversational_opener_with_data(
    question: str,
    row_count: int,
    context: Dict[str, Any],
    rows: List[Dict[str, Any]] = None
) -> str:
    """
    Generate opener with EXACT counts - no rounding!
    """
    
    # ✅ CRITICAL: Use exact count with comma formatting
    exact_count_formatted = f"{row_count:,}"
    
    # Classify the result type
    result_type = classify_result_type(rows) if rows else "UNKNOWN"
    
    # Extract business count (e.g., customers, policies, etc.)
    business_count = extract_business_count(rows, result_type) if rows else None
    
    # ✅ Use business count if available, otherwise use row count
    if business_count is not None:
        display_count = business_count
        display_count_formatted = f"{business_count:,}"
    else:
        display_count = row_count
        display_count_formatted = exact_count_formatted
    
    print(f"🎯 Generating opener with EXACT count: {display_count_formatted} (type: {result_type})")
    
    # Detect if it's a yes/no question
    if is_yes_no_question(question):
        return generate_yes_no_opener(question, display_count)
    
    # ✅ Generate opener based on result type with EXACT counts
    if result_type == "GROUPED_METRIC":
        # For grouped metrics, describe the analysis without mentioning "records"
        return f"The analysis identified the top customers with the highest churn counts for each month, providing insights into the over {display_count_formatted} customers who churned."
    elif result_type == "SINGLE_METRIC":
        # For single metrics, state the value directly
        return f"The total came to {display_count_formatted}."
    
    elif result_type == "ENTITY_LIST":
        # For entity lists, use exact count
        return f"Here are the {display_count_formatted} results that match your query."
    
    else:
        # Default: use exact count
        if display_count == 0:
            return "No results were found matching your criteria."
        elif display_count == 1:
            return "I found 1 record that matches your query."
        else:
            # ✅ EXACT COUNT - no rounding!
            return f"I found {display_count_formatted} records that match your query."


# Helper function to detect yes/no questions
def is_yes_no_question(question: str) -> bool:
    """Detect if question expects yes/no answer"""
    q_lower = question.lower().strip()
    
    yn_patterns = [
        r'^is\s+',
        r'^are\s+',
        r'^was\s+',
        r'^were\s+',
        r'^do\s+',
        r'^does\s+',
        r'^did\s+',
        r'^has\s+',
        r'^have\s+',
        r'^can\s+',
        r'^could\s+',
        r'^will\s+',
        r'^would\s+',
        r'^should\s+'
    ]
    
    return any(re.match(pattern, q_lower) for pattern in yn_patterns)


# def generate_yes_no_opener20_1(question: str, count: int) -> str:
#     """Generate yes/no opener with exact count"""
#     count_formatted = f"{count:,}"
    
#     if count > 0:
#         return f"Yes, I found {count_formatted} matching records."
#     else:
#         return "No, there are no records matching that criteria."


# def classify_result_type(rows: List[Dict[str, Any]]) -> str:
#     """
#     Classify the type of result set
#     Returns: GROUPED_METRIC, SINGLE_METRIC, ENTITY_LIST, or UNKNOWN
#     """
#     if not rows or len(rows) == 0:
#         return "EMPTY"
    
#     first_row = rows[0]
#     columns = list(first_row.keys())
    
#     # Single metric (one row, one or two columns)
#     if len(rows) == 1 and len(columns) <= 2:
#         return "SINGLE_METRIC"
    
#     # Grouped metric (multiple rows with grouping columns + metric columns)
#     # Look for aggregation patterns
#     metric_keywords = ['count', 'sum', 'avg', 'total', 'amount', 'revenue', 'churn']
#     has_metric = any(any(keyword in col.lower() for keyword in metric_keywords) for col in columns)
    
#     if has_metric and len(rows) > 1:
#         return "GROUPED_METRIC"
    
#     # Entity list (multiple rows with entity identifiers)
#     entity_keywords = ['id', 'name', 'customer', 'policy', 'user', 'account']
#     has_entity = any(any(keyword in col.lower() for keyword in entity_keywords) for col in columns)
    
#     if has_entity:
#         return "ENTITY_LIST"
    
#     return "UNKNOWN"


def extract_business_count(rows: List[Dict[str, Any]], result_type: str) -> int | None:
    """
    Extract the actual business count (e.g., number of customers)
    instead of just the row count
    """
    if not rows or result_type == "EMPTY":
        return None
    
    # For grouped metrics, count unique entities
    if result_type == "GROUPED_METRIC":
        # Look for customer/entity ID columns
        first_row = rows[0]
        columns = list(first_row.keys())
        
        entity_cols = [col for col in columns if any(
            keyword in col.lower() 
            for keyword in ['customer', 'policy', 'user', 'account', 'id']
        )]
        
        if entity_cols:
            # Count unique values in the first entity column
            entity_col = entity_cols[0]
            unique_entities = set(row.get(entity_col) for row in rows if row.get(entity_col) is not None)
            return len(unique_entities)
    
    # For single metrics, check if there's a count column
    if result_type == "SINGLE_METRIC":
        first_row = rows[0]
        count_cols = [col for col in first_row.keys() if 'count' in col.lower() or 'total' in col.lower()]
        
        if count_cols:
            count_value = first_row.get(count_cols[0])
            if isinstance(count_value, (int, float)):
                return int(count_value)
    
    return None

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



def classify_result_type(rows):
    """
    Determine how results should be narrated
    """
    if not isinstance(rows, list) or not rows:
        return "EMPTY"

    # Single aggregated metric
    if (
        len(rows) == 1
        and isinstance(rows[0], dict)
        and len(rows[0]) == 1
        and isinstance(next(iter(rows[0].values())), (int, float))
    ):
        return "SINGLE_METRIC"

    # Grouped / segmented metrics (small number of rows, numeric values)
    if (
        all(isinstance(r, dict) for r in rows)
        and len(rows) <= 20
        and any(isinstance(v, (int, float)) for v in rows[0].values())
    ):
        return "GROUPED_METRIC"

    # Normal row-level data
    return "ROW_LEVEL"


def extract_business_count(rows, result_type):
    if result_type == "SINGLE_METRIC":
        return int(next(iter(rows[0].values())))

    if result_type == "GROUPED_METRIC":
        # Do NOT treat as record count
        return None  # important

    if result_type == "ROW_LEVEL":
        return len(rows)

    return 0


def has_metric_variance(rows):
    if not rows or len(rows) < 2:
        return False

    # Detect numeric metric column (e.g., churn_rate_percentage)
    numeric_keys = [
        k for k, v in rows[0].items()
        if isinstance(v, (int, float))
    ]

    if not numeric_keys:
        return False

    metric_key = numeric_keys[0]

    values = {r.get(metric_key) for r in rows}
    return len(values) > 1
# ============================================================
# FIX 6: UPDATED CONVERSATIONAL OPENER (for loading phase)
# ============================================================

def generate_dynamic_conversational_opener(question: str, metrics: Dict[str, Any]) -> str:
    """Generate dynamic opener - handles yes/no questions gracefully during loading"""
    llm = get_llama_maverick_llm()
    
    question_lower = question.lower().strip()
    
    # Check if yes/no question
    if is_yes_no_question(question):
        return (
            "I’m analyzing the relevant records to answer your question accurately. "
            "I’ll share what I find in a moment."
        )
    
    metric_varies = has_metric_variance(rows)

    if result_type == "GROUPED_METRIC" and not metric_varies:
        sample_info += "\n⚠️ All segments show identical metric values"


    
    # Determine domain
    if any(word in question_lower for word in ['churn', 'retention', 'customer', 'policy']):
        domain = "customer analytics"
    elif any(word in question_lower for word in ['branch', 'location', 'office']):
        domain = "branch performance"
    elif any(word in question_lower for word in ['premium', 'revenue', 'sales']):
        domain = "revenue analysis"
    elif any(word in question_lower for word in ['campaign', 'marketing']):
        domain = "marketing insights"
    else:
        domain = "business intelligence"
    
    system_prompt = (
        "You are a friendly, experienced data analyst generating an opener BEFORE data analysis is complete. "
        "This opener shows during loading, so NEVER mention results, findings, or data availability. "
        "Focus on what you're ABOUT TO DO, not what you found. "
        "Be warm, professional, and encouraging. NO emojis. 2-3 sentences max. "
        "CRITICAL: Never say 'no data', 'no records', 'nothing found', or anything negative about results."
    )
    
    context = {
        "user_question": question,
        "analysis_domain": domain,
        "loading_phase": True
    }
    
    user_prompt = (
        f"Generate a conversational opener for starting this data analysis:\n"
        f"{json.dumps(context, indent=2)}\n\n"
        "This opener shows WHILE loading, so focus on:\n"
        "- What you're about to analyze\n"
        "- Your enthusiasm for helping\n"
        "- The process you'll follow\n\n"
        "DO NOT mention any results or data availability since analysis hasn't finished yet.\n"
        "Respond with ONLY the opener text - no JSON, no formatting."
    )
    
    
    try:
        opener = llm._call(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=150,
        )
        
        opener = (opener or "").strip().strip('"').strip("'")
        
        # Filter negative phrases
        negative_patterns = [
            "no data", "no records", "nothing found", "don't have", "aren't any",
            "not available", "no results", "no information", "bit of a surprise",
            "unfortunately", "however", "but when I", "found that there"
        ]
        
        opener_lower = opener.lower()
        if any(pattern in opener_lower for pattern in negative_patterns) or len(opener) < 10:
            positive_fallbacks = [
                f"Let me analyze your {domain} question and gather the relevant insights for you.",
                f"I'm diving into your {domain} data to provide you with comprehensive analysis.",
                f"Great question about {domain}! I'm processing your request to deliver detailed insights.",
                f"I'm excited to help with your {domain} analysis and will have results for you shortly.",
                f"Let me examine your {domain} data thoroughly to give you the best possible insights."
            ]
            opener = random.choice(positive_fallbacks)
        
        return opener
        
    except Exception as e:
        print(f"⚠️ Dynamic opener generation failed: {e}")
        return f"I'm analyzing your {domain} question and will have comprehensive insights for you shortly."

def _normalize_metric_value(key: str, value: float) -> float:
    """
    🚨 KPI SAFETY RULE
    - If SQL already returned *_percentage → trust it
    - If key contains 'rate' → DO NOT multiply
    """
    if key.endswith("_percentage"):
        return round(value, 2)

    if "rate" in key.lower():
        # value is already final (fraction or percent decided by SQL)
        return round(value, 4)

    return value



# Helper function for metrics (also needs Decimal handling)
def _derive_contextual_metrics(question: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract rich contextual data - NOW HANDLES DECIMALS
    
    ⚠️ CRITICAL: Only provide HIGH-LEVEL metrics, NOT preview-specific counts
    This prevents generating misleading insights like "10 unique customers" when
    we're only looking at a 10-row preview of a 1000-row dataset.
    """
    # ✅ Ensure rows are Decimal-free
    rows = _convert_decimals_to_float(rows)
    
    # Use larger preview for better pattern detection
    preview = _to_preview_rows(rows, 100)

    
    
    metrics = {
        "row_count": len(rows),  # FULL dataset count
        "columns": list(preview[0].keys()) if preview else [],
        "has_data": len(rows) > 0,
        "data_size": "small" if len(rows) < 10 else "medium" if len(rows) < 100 else "large",
    }
    
    # ✅ DON'T provide column_analysis that leads to "10 unique values" insights
    # The LLM will create better insights from the actual data patterns
    
    if preview and len(rows) > 1:
        # Only identify numeric vs categorical columns (no counts!)
        column_types = {}
        for col in metrics["columns"]:
            sample_values = [r.get(col) for r in preview[:20] if r.get(col) is not None]
            if not sample_values:
                continue
                
            # Check if numeric
            numeric_count = 0
            for val in sample_values[:10]:
                try:
                    float(val)
                    numeric_count += 1
                except:
                    pass
            
            # Classify based on numeric ratio
            if numeric_count / len(sample_values[:10]) > 0.8:
                column_types[col] = "numeric"
            else:
                column_types[col] = "categorical"
        
        metrics["column_types"] = column_types
        
        # Only provide aggregation patterns if we have meaningful groupings
        numeric_cols = [col for col, typ in column_types.items() if typ == "numeric"]
        categorical_cols = [col for col, typ in column_types.items() if typ == "categorical"]
        
        if numeric_cols and categorical_cols and len(rows) >= 5:
            # Only create aggregations if dataset is large enough to be meaningful
            main_numeric = numeric_cols[0]
            main_categorical = categorical_cols[0]
            
            aggregations = {}
            for row in preview[:100]:  # Use more rows for accurate patterns
                cat_val = str(row.get(main_categorical, "Unknown"))
                # num_val = row.get(main_numeric, 0)
                raw_val = row.get(main_numeric, 0)
                try:
                    raw_val = float(raw_val)

                    # 🚨 APPLY KPI RULE HERE
                    num_val = _normalize_metric_value(main_numeric, raw_val)

                    if cat_val not in aggregations:
                        aggregations[cat_val] = []
                    aggregations[cat_val].append(num_val)

                except:
                    continue

                # try:
                #     num_val = float(num_val)
                #     if cat_val not in aggregations:
                #         aggregations[cat_val] = []
                #     aggregations[cat_val].append(num_val)
                # except:
                #     continue
            
            # Only include if we have at least 2 categories
            if len(aggregations) >= 2:
                agg_summary = {}
                for cat, values in aggregations.items():
                    if values and len(values) >= 2:  # Need multiple values per category
                        agg_summary[cat] = {
                            "count": len(values),
                            "total": sum(values),
                            "avg": sum(values) / len(values),
                        }
                
                # if len(agg_summary) >= 2:  # Only include if meaningful
                #     metrics["aggregation_summary"] = dict(sorted(
                #         agg_summary.items(), 
                #         key=lambda x: x[1].get("total", 0), 
                #         reverse=True
                #     )[:5])  # Top 5 only
    
    return metrics


def _to_preview_rows(rows: List[Dict[str, Any]], limit: int = 25) -> List[Dict[str, Any]]:
    """Get preview rows - with Decimal handling"""
    if not isinstance(rows, list):
        return []
    # ✅ Convert Decimals in preview
    preview = rows[:limit]
    return _convert_decimals_to_float(preview)



def _generate_smart_fallback_opener(
    question: str, 
    result_type: str, 
    display_count: int, 
    rows: list = None
) -> str:
    """Generate intelligent fallback opener based on result type"""
    
    # ✅ CRITICAL: Handle zero results FIRST
    if display_count == 0:
        entity_name = _get_business_entity_name(question, result_type, rows)
        # Remove trailing 's' for singular form when count is 0
        singular_entity = entity_name.rstrip('s') if entity_name.endswith('s') else entity_name
        return f"No {entity_name} were found matching your criteria."
    
    entity_name = _get_business_entity_name(question, result_type, rows)
    
    if result_type == "SINGLE_METRIC":
        return f"We've calculated the key metric for your analysis."
    
    elif result_type == "GROUPED_METRIC":
        if display_count <= 1:
            return f"We've analyzed your data for {question.lower()}."
        else:
            return f"We've analyzed patterns across {display_count} {entity_name}."
    
    elif result_type == "ROW_LEVEL":
        if display_count == 1:
            return f"We've identified 1 {entity_name.rstrip('s')} matching your criteria."
        else:
            return f"We've analyzed {display_count:,} {entity_name} matching your criteria."
    
    else:
        return ""

    
def _get_business_entity_name(question: str, result_type: str, rows: list = None) -> str:
    """Determine what business entity the data represents"""
    q_lower = question.lower()
    
    # For grouped data, interpret the grouping dimension
    if result_type in ["GROUPED_METRIC", "SINGLE_METRIC"]:
        if any(word in q_lower for word in ["by tenure", "tenure", "duration"]):
            return "tenure segments"
        elif any(word in q_lower for word in ["by state", "state", "geographic"]):
            return "states"
        elif any(word in q_lower for word in ["by quarter", "quarter", "quarterly"]):
            return "quarters"
        elif any(word in q_lower for word in ["by month", "month", "monthly"]):
            return "months"
        elif any(word in q_lower for word in ["by product", "product type"]):
            return "product categories"
        elif any(word in q_lower for word in ["by branch", "branch"]):
            return "branches"
        elif any(word in q_lower for word in ["by customer", "customer segment"]):
            return "customer segments"
        else:
            # Try to infer from data columns
            if rows and len(rows) > 0 and isinstance(rows[0], dict):
                cols = [c.lower() for c in rows[0].keys()]
                if any("state" in c for c in cols):
                    return "states"
                elif any("month" in c or "quarter" in c for c in cols):
                    return "time periods"
                elif any("type" in c or "category" in c for c in cols):
                    return "categories"
                elif any("tenure" in c or "duration" in c for c in cols):
                    return "tenure segments"
            return "segments"
    
    # For row-level data
    if "customer" in q_lower:
        return "customers"
    elif "policy" in q_lower or "policies" in q_lower:
        return "policies"
    elif "claim" in q_lower:
        return "claims"
    elif "branch" in q_lower:
        return "branches"
    elif "transaction" in q_lower:
        return "transactions"
    else:
        return "records"



def _generate_dynamic_fallback_insights(question: str, rows: List[Dict], metrics: Dict) -> List[str]:
    """Generate insights using LLM even in fallback mode"""
    llm = get_llama_maverick_llm()

    actual_count = len(rows) if isinstance(rows, list) else 0
    
    if not rows:
        return [
            "This query did not return matching records under the current filters.",
            "Consider adjusting the time period or expanding the geographic scope.",
            "The query structure is valid and ready for broader parameter testing."
        ]

    context = {
        "question": question,
        "ACTUAL_row_count": actual_count,
        "row_count_formatted": f"{actual_count:,}",
        "key_data": metrics.get("aggregation_summary", {}),
        "columns": metrics.get("columns", [])
    }

    prompt = (
        f"⚠️ CRITICAL: You are analyzing {actual_count:,} total records.\n\n"
        f"Generate 2-3 natural insights about this data analysis:\n"
        f"{json.dumps(context, indent=2)}\n\n"
        "Write like a human analyst. Be specific and constructive. "
        "NEVER use phrases like: 'no data', 'no records', 'nothing to analyze', "
        "'bit of a surprise', 'unfortunately', 'however', 'but when I'.\n"
        "Focus on what WAS found and analyzed.\n\n"
        "Return as a JSON array of strings."
        "You are a skilled data analyst talking to a business colleague. "
        "DO NOT mention SQL, filters, table names, column names, or technical query details. "
        "Focus ONLY on customer/business insights and recommendations. "
        "If you need to acknowledge filters, say 'active customers' or 'valid records' instead of technical terms."
    )

    try:
        response = llm._call(prompt=prompt, temperature=0.6, max_tokens=300)
        insights = json.loads(response)
        if isinstance(insights, list):
            filtered_insights = []
            negative_phrases = ["no data", "no records", "nothing", "unfortunately", "however", "but when"]
            
            for insight in insights[:4]:
                insight_lower = insight.lower()
                if not any(phrase in insight_lower for phrase in negative_phrases):
                    filtered_insights.append(insight)
            
            if filtered_insights:
                return filtered_insights
    except:
        pass

    return [
        # f"I analyzed {actual_count:,} records from your query.",
        # f"The dataset includes {len(metrics.get('columns', []))} different fields with useful information.",
        "Here are the key patterns and trends I identified from the data."
    ]



def _generate_dynamic_fallback_recommendations(question: str, rows: List[Dict], metrics: Dict) -> List[str]:
    """Generate recommendations using LLM even in fallback mode"""
    llm = get_llama_maverick_llm()
    
    context = {
        "question_intent": question,
        "data_size": len(rows),
        "patterns_found": bool(metrics.get("aggregation_summary"))
    }
    
    prompt = (
        f"Based on this analysis context, suggest 2-3 natural next actions:\n"
        f"{json.dumps(context, indent=2)}\n\n"
        "Sound like a helpful analyst colleague. Return as JSON array of strings."
    )
    
    try:
        response = llm._call(prompt=prompt, temperature=0.6, max_tokens=200)
        recs = json.loads(response)
        if isinstance(recs, list):
            return recs[:4]
    except:
        pass
    
    return [
        "Consider exploring different time periods for comparison.",
        "You might want to segment this data by additional categories."
    ]

def humanize_narrative2412(
    question: str,
    rows: List[Dict[str, Any]],
    summary: str,
    recommendation: str,
    sql: str,
    data_window: Dict[str, str] | None = None,
    model_temperature: float = 0.6,
    opener: str = None,
    corpus_insights: Dict[str, Any] | None = None
) -> Dict[str, Any]:
    """
    Fully dynamic narrative generation - LLM creates all content naturally.
    If corpus insights exist, they will be blended with SQL analysis.
    """
    llm = get_llama_maverick_llm()
    
    # Extract rich contextual data
    metrics = _derive_contextual_metrics(question, rows)
    preview = _to_preview_rows(rows, 20)
    
    # Enhanced system prompt - STRONGER negative phrase prevention
    system = (
        "You are a skilled data analyst having a natural conversation with a colleague. "
        "Blend curated knowledge (if available) with fresh SQL data. "
        "Explain results warmly and professionally.\n\n"

        "CRITICAL RULES FOR TONE:\n"
        "- ABSOLUTELY NEVER use these phrases: 'no records', 'no data', 'nothing to pull', "
        "'bit of a surprise', 'unfortunately', 'however', 'but when I dug in', 'aren't actually any', "
        "'don't have any data', 'nothing found', 'no results to show'\n"
        "- If results are empty, ONLY say: 'This query did not return matching records under the current filters.'\n"
        "- If results exist, START with what you DID find, never what you didn't find\n"
        "- Always maintain constructive, forward-looking tone\n"
        "- NO emojis or apologetic language\n\n"
        " - NEVER mention SQL queries, filters like IS NOT NULL, or column names. "
        "- Explain insights in plain business terms (e.g., 'active customers' instead of 'policy_end_date_year IS NOT NULL')."

    "DO NOT mention SQL, filters, table names, column names, or technical query details. "
    "Focus ONLY on customer/business insights and recommendations. "
    "If you need to acknowledge filters, say 'active customers' or 'valid records' instead of technical terms."

        "Response format (JSON only):\n"
        "{\n"
        '  "opener": "Natural 2-3 sentence conversation starter (POSITIVE ONLY)",\n'
        '  "insights": ["Specific finding 1", "Specific finding 2", ...],\n'
        '  "recommendations": ["Action item 1", "Action item 2", ...],\n'
        '   "next_step": ["Follow-up 1", "Follow-up 2", "Follow-up 3"]\n'
    "}\n\n"
    "Always provide 2 or 3 distinct and constructive next_step."
        # '  "next_step": "Natural offer for follow-up"\n'
        # "}"
    )
    
    # Build analysis context with both SQL + corpus
    analysis_context = {
        "user_question": question,
        "data_summary": {
            "total_rows": len(rows),
            "columns_available": metrics.get("columns", []),
            "data_patterns": metrics.get("aggregation_summary", {}),
            "column_insights": metrics.get("column_analysis", {}),
            "time_period": data_window or {}
        },
        "sample_data": preview,
        "existing_summary": summary,
        "existing_recommendation": recommendation,
        # "sql_context": sql,
        "sql_context": "Technical query used (hidden from narrative output).",
    }
    
    # Blend corpus insights if provided
    if corpus_insights:
        analysis_context["corpus_knowledge"] = {
            "summary": corpus_insights.get("summary"),
            "recommendations": corpus_insights.get("recommendations", []),
            "sql_used_before": corpus_insights.get("sql"),
            "chart_config": corpus_insights.get("chart_config"),
            "row_count_previous": corpus_insights.get("row_count")
        }
    
    user_prompt = (
        "Please analyze this data and create a natural, conversational explanation. "
        "Blend any provided corpus knowledge with fresh SQL insights. "
        "Write like you're a human analyst talking to a colleague.\n\n"
        "TONE REQUIREMENTS:\n"
        "- Be constructive and solution-focused\n"
        "- If no data found, suggest broadening scope rather than dwelling on the lack of results\n"
        "- Focus on what CAN be done, not what couldn't be found\n\n"
        f"ANALYSIS CONTEXT:\n{json.dumps(analysis_context, ensure_ascii=False, indent=2)}\n\n"
        "Generate a natural narrative that sounds authentically human. "
        "If both corpus and SQL data are present, merge them seamlessly."
          "You are a skilled data analyst talking to a business colleague. "
        "DO NOT mention SQL, filters, table names, column names, or technical query details. "
        "Focus ONLY on customer/business insights and recommendations. "
        "If you need to acknowledge filters, say 'active customers' or 'valid records' instead of technical terms."
    )
    
    try:
        raw_response = llm._call(
            prompt=user_prompt,
            system_prompt=system,
            temperature=model_temperature,
            max_tokens=800,
        )
        
        narrative_obj = _clean_and_extract_json(raw_response)
        
        if not isinstance(narrative_obj, dict) or not narrative_obj:
            raise ValueError("Invalid or empty response structure")
        
        # Enhanced validation and filtering for opener
        if not narrative_obj.get("opener"):
            if opener:
                narrative_obj["opener"] = opener
            else:
                narrative_obj["opener"] = generate_dynamic_conversational_opener(question, metrics)
        else:
            # Filter negative phrases from generated opener
            opener_text = narrative_obj["opener"]
            negative_patterns = [
                "no records", "no data", "nothing to pull", "bit of a surprise",
                "unfortunately", "however", "but when I", "aren't actually any",
                "don't have any", "nothing found", "found that there"
            ]
            
            opener_lower = opener_text.lower()
            if any(pattern in opener_lower for pattern in negative_patterns):
                # Replace with positive version
                narrative_obj["opener"] = generate_dynamic_conversational_opener(question, metrics)
        
        if not isinstance(narrative_obj.get("insights"), list):
            narrative_obj["insights"] = _generate_dynamic_fallback_insights(question, rows, metrics)
            
        if not isinstance(narrative_obj.get("recommendations"), list):
            narrative_obj["recommendations"] = _generate_dynamic_fallback_recommendations(question, rows, metrics)
            
        if not narrative_obj.get("next_step"):
            narrative_obj["next_step"] = _generate_dynamic_next_step(question, metrics)

        # 🆕 Ensure next_steps (list of 2–3)
        if not narrative_obj.get("next_steps"):
            try:
                narrative_obj["next_steps"] = _generate_dynamic_next_steps(question, metrics)
                if isinstance(narrative_obj["next_steps"], list):
                    narrative_obj["next_steps"] = narrative_obj["next_steps"][:3]  # limit to 3
                else:
                    # fallback: wrap single next_step into array
                    narrative_obj["next_steps"] = [narrative_obj.get("next_step")]
            except Exception:
                narrative_obj["next_steps"] = [narrative_obj.get("next_step")]
        
        return narrative_obj
        
    except Exception as e:
        print(f"⚠️ Dynamic narrative generation failed: {e}")
        return _generate_intelligent_fallback(question, rows, metrics, opener)

# def _generate_dynamic_fallback_insights(question: str, rows: List[Dict], metrics: Dict) -> List[str]:
#     """Generate insights using LLM even in fallback mode"""
#     llm = get_llama_maverick_llm()
    
#     if not rows:
#         return ["No matching data was found for your query."]
    
#     context = {
#         "question": question,
#         "row_count": len(rows),
#         "key_data": metrics.get("aggregation_summary", {}),
#         "columns": metrics.get("columns", [])
#     }
    
#     prompt = (
#         f"Generate 2-3 natural insights about this data analysis:\n"
#         f"{json.dumps(context, indent=2)}\n\n"
#         "Write like a human analyst. Be specific. Return as a JSON array of strings."
#         "Don't return like this below:So it looks like we don't have any records to analyze, but interestingly, the query still returned results, which is a bit unexpected."
#     )
    
#     try:
#         response = llm._call(prompt=prompt, temperature=0.6, max_tokens=300)
#         insights = json.loads(response)
#         if isinstance(insights, list):
#             return insights[:4]
#     except:
#         pass
    
#     # Simple fallback
#     return [
#         f"I analyzed {len(rows)} records from your query.",
#         f"The data includes {len(metrics.get('columns', []))} different data points.",
#         "Here are the key patterns I identified."
#     ]


# def _generate_dynamic_fallback_insights(question: str, rows: List[Dict], metrics: Dict) -> List[str]:
#     """Generate insights using LLM even in fallback mode"""
#     llm = get_llama_maverick_llm()

#     if not rows:
#         # Neutral fallback for empty results
#         return ["This query did not return any matching records under the current filters."]

#     context = {
#         "question": question,
#         "row_count": len(rows),
#         "key_data": metrics.get("aggregation_summary", {}),
#         "columns": metrics.get("columns", [])
#     }

#     prompt = (
#         f"Generate 2-3 natural insights about this data analysis:\n"
#         f"{json.dumps(context, indent=2)}\n\n"
#         "Write like a human analyst. Be specific. "
#         "Do not use phrases like 'no data', 'no records', 'nothing to analyze', "
#         "or 'bit of a surprise'. Keep tone constructive and professional.\n\n"
#         "Return as a JSON array of strings."
#     )

#     try:
#         response = llm._call(prompt=prompt, temperature=0.6, max_tokens=300)
#         insights = json.loads(response)
#         if isinstance(insights, list):
#             return insights[:4]
#     except:
#         pass

#     # Simple static fallback (neutral wording only)
#     return [
#         f"I analyzed {len(rows)} records from your query.",
#         f"The dataset includes {len(metrics.get('columns', []))} different fields.",
#         "Here are the key patterns I identified."
#     ]
# Update the fallback insights function to be more positive


def _generate_dynamic_fallback_insights(question: str, rows: List[Dict], metrics: Dict) -> List[str]:
    """Generate insights using LLM even in fallback mode"""
    llm = get_llama_maverick_llm()

    if not rows:
        # Completely neutral, solution-focused fallback for empty results
        return [
            "This query did not return matching records under the current filters.",
            "Consider adjusting the time period or expanding the geographic scope.",
            "The query structure is valid and ready for broader parameter testing."
        ]

    # Extract the actual value for single count results
    actual_result = None
    if len(rows) == 1:
        # Get the first (and only) value from the single row
        row_values = list(rows[0].values())
        if row_values:
            actual_result = row_values[0]

    context = {
        "question": question,
        "row_count": len(rows),
        "key_data": metrics.get("aggregation_summary", {}),
        "columns": metrics.get("columns", []),
        "sample_rows": rows[:5] if len(rows) > 1 else rows,
        "actual_value": actual_result
    }

    prompt = (
        f"Generate 2-3 natural insights about this data analysis:\n"
        f"Question: {question}\n"
        f"Data Context: {json.dumps(context, indent=2)}\n\n"
        "Write like a human analyst. Be specific and constructive. "
        "NEVER use phrases like: 'no data', 'no records', 'nothing to analyze', "
        "'bit of a surprise', 'unfortunately', 'however', 'but when I'.\n"
        "Focus on what WAS found and analyzed.\n\n"
        "Return as a JSON array of strings."
        "You are a skilled data analyst talking to a business colleague. "
        "DO NOT mention SQL, filters, table names, column names, or technical query details. "
        "Focus ONLY on customer/business insights and recommendations. "
        "If you need to acknowledge filters, say 'active customers' or 'valid records' instead of technical terms."
        f"{' IMPORTANT: The actual result value is ' + str(actual_result) + '. Use this exact number in your insights and directly answer the question asked.' if actual_result is not None else ''}"
        
    )

    try:
        response = llm._call(prompt=prompt, temperature=0.6, max_tokens=300)
        insights = json.loads(response)
        if isinstance(insights, list):
            # Filter out any negative insights that might slip through
            filtered_insights = []
            negative_phrases = ["no data", "no records", "nothing", "unfortunately", "however", "but when"]
            
            for insight in insights[:4]:
                insight_lower = insight.lower()
                if not any(phrase in insight_lower for phrase in negative_phrases):
                    filtered_insights.append(insight)
            
            if filtered_insights:
                return filtered_insights
    except:
        pass

    # Simple static fallback (positive wording only)
    return [
        # f"I analyzed {len(rows)} records from your query.",
        # f"The dataset includes {len(metrics.get('columns', []))} different fields with useful information.",
        "Here are the key patterns and trends I identified from the data."
    ]

def _generate_dynamic_fallback_insights21_01(question: str, rows: List[Dict], metrics: Dict) -> List[str]:
    """Generate insights using LLM even in fallback mode"""
    llm = get_llama_maverick_llm()

    if not rows:
        # Completely neutral, solution-focused fallback for empty results
        return [
            "This query did not return matching records under the current filters.",
            "Consider adjusting the time period or expanding the geographic scope.",
            "The query structure is valid and ready for broader parameter testing."
        ]

    context = {
        "question": question,
        "row_count": len(rows),
        "key_data": metrics.get("aggregation_summary", {}),
        "columns": metrics.get("columns", [])
    }

    prompt = (
        f"Generate 2-3 natural insights about this data analysis:\n"
        f"{json.dumps(context, indent=2)}\n\n"
        "Write like a human analyst. Be specific and constructive. "
        "NEVER use phrases like: 'no data', 'no records', 'nothing to analyze', "
        "'bit of a surprise', 'unfortunately', 'however', 'but when I'.\n"
        "Focus on what WAS found and analyzed.\n\n"
        "Return as a JSON array of strings."
          "You are a skilled data analyst talking to a business colleague. "
    "DO NOT mention SQL, filters, table names, column names, or technical query details. "
    "Focus ONLY on customer/business insights and recommendations. "
    "If you need to acknowledge filters, say 'active customers' or 'valid records' instead of technical terms."
        
    )

    try:
        response = llm._call(prompt=prompt, temperature=0.6, max_tokens=300)
        insights = json.loads(response)
        if isinstance(insights, list):
            # Filter out any negative insights that might slip through
            filtered_insights = []
            negative_phrases = ["no data", "no records", "nothing", "unfortunately", "however", "but when"]
            
            for insight in insights[:4]:
                insight_lower = insight.lower()
                if not any(phrase in insight_lower for phrase in negative_phrases):
                    filtered_insights.append(insight)
            
            if filtered_insights:
                return filtered_insights
    except:
        pass

    # Simple static fallback (positive wording only)
    return [
        # f"I analyzed {len(rows)} records from your query.",
        # f"The dataset includes {len(metrics.get('columns', []))} different fields with useful information.",
        "Here are the key patterns and trends I identified from the data."
    ]

def _generate_dynamic_fallback_recommendations2412(question: str, rows: List[Dict], metrics: Dict) -> List[str]:
    """Generate recommendations using LLM even in fallback mode"""
    llm = get_llama_maverick_llm()
    
    context = {
        "question_intent": question,
        "data_size": len(rows),
        "patterns_found": bool(metrics.get("aggregation_summary"))
    }
    
    prompt = (
        f"Based on this analysis context, suggest 2-3 natural next actions:\n"
        f"{json.dumps(context, indent=2)}\n\n"
        "Sound like a helpful analyst colleague. Return as JSON array of strings."
    )
    
    try:
        response = llm._call(prompt=prompt, temperature=0.6, max_tokens=200)
        recs = json.loads(response)
        if isinstance(recs, list):
            return recs[:4]
    except:
        pass
    
    # Simple fallback
    return [
        "Consider exploring different time periods for comparison.",
        "You might want to segment this data by additional categories."
    ]

def _generate_dynamic_next_step(question: str, metrics: Dict) -> str:
    """Generate next step using LLM"""
    llm = get_llama_maverick_llm()
    
    prompt = (
        f"Given this analysis of '{question}' with {metrics.get('row_count', 0)} results, "
        "what would you naturally offer as a follow-up? One conversational sentence."
    )
    
    try:
        response = llm._call(prompt=prompt, temperature=0.7, max_tokens=100)
        next_step = response.strip().strip('"').strip("'")
        if len(next_step) > 10:
            return next_step
    except:
        pass
    
    return "Want to dive deeper into any of these findings?"

# def _generate_intelligent_fallback(question: str, rows: List[Dict], metrics: Dict, opener: str = None) -> Dict[str, Any]:
#     """Even the fallback uses dynamic LLM generation"""
#     return {
#         "opener": opener or generate_dynamic_conversational_opener(question, metrics),
#         "insights": _generate_dynamic_fallback_insights(question, rows, metrics),
#         "recommendations": _generate_dynamic_fallback_recommendations(question, rows, metrics),
#         "next_step": _generate_dynamic_next_step(question, metrics)
#     }

def _generate_dynamic_next_steps(question: str, metrics: Dict) -> List[str]:
    """Generate multiple follow-up questions using LLM"""
    llm = get_llama_maverick_llm()
    
    prompt = (
        f"Based on the analysis of '{question}' with {metrics.get('row_count', 0)} results, "
        "generate 3 natural follow-up questions the user might ask next. "
        "Make them constructive and analysis-focused. "
        "Return ONLY as a JSON array of strings."
    )
    
    try:
        response = llm._call(prompt=prompt, temperature=0.7, max_tokens=200)
        next_steps = json.loads(response)
        if isinstance(next_steps, list) and len(next_steps) >= 2:
            return next_steps[:3]
    except Exception as e:
        print(f"⚠️ next_steps generation failed: {e}")
    
    # fallback
    return [
        "Would you like me to break this down by customer segments?",
        "Do you want to compare this period against last quarter?",
        "Shall I highlight which regions contributed most to this trend?"
    ]



def _generate_intelligent_fallback(question: str, rows: List[Dict], metrics: Dict, opener: str = None,row_count_formatted: str = None, display_count: int = None,) -> Dict[str, Any]:
    """Even the fallback uses dynamic LLM generation"""
    return {
        "opener": opener or generate_dynamic_conversational_opener(question, metrics),
        "insights": _generate_dynamic_fallback_insights(question, rows, metrics),
        "recommendations": _generate_dynamic_fallback_recommendations(question, rows, metrics),
        "next_step": _generate_dynamic_next_step(question, metrics),  # ✅ legacy single suggestion
        "next_steps": _generate_dynamic_next_steps(question, metrics)  # ✅ new multiple suggestions
    }