from celery import shared_task
from openpyxl import load_workbook
import os
import pandas as pd

def normalize_category_name(category):
    """Ensures category name matches available files."""
    name_map = {
        "base": "Base Template.xlsx",
        "pr": "Pr Template.xlsx",
        "claim": "Claim Template.xlsx"
    }
    return name_map.get(category.lower(), f"{category.capitalize()} Template.xlsx")

@shared_task
def async_validate_excel(file_path, category):
    """Asynchronous Excel validation task"""
    try:
        # ✅ **Normalize file name**
        template_filename = normalize_category_name(category)
        template_path = os.path.join(settings.BASE_DIR, "myproject", "Excel_Templates", template_filename)

        if not os.path.exists(template_path):
            return {"success": False, "message": f"File '{template_filename}' not found. Available files: {os.listdir(os.path.dirname(template_path))}"}

        # ✅ Load headers from template
        df_template = pd.read_excel(template_path, nrows=0)
        required_headers = [col.strip().lower() for col in df_template.columns]

        # ✅ Read headers from uploaded file
        df_uploaded = pd.read_excel(file_path, nrows=0)
        uploaded_headers = [col.strip().lower() for col in df_uploaded.columns]

        missing_columns = [col for col in required_headers if col not in uploaded_headers]

        if missing_columns:
            return {"success": False, "message": f"Missing required columns: {', '.join(missing_columns)}"}

        return {"success": True, "message": "File validated successfully"}

    except Exception as e:
        return {"success": False, "message": str(e)}
