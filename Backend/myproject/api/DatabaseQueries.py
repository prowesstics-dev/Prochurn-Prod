import psycopg2
from psycopg2 import sql
from django.conf import settings
from rest_framework.decorators import api_view


def get_connection():
    """
    Connect to PostgreSQL with custom credentials.
    """
    try:
        return psycopg2.connect(
            dbname="postgres",     # ✅ Your database name
            user="postgres",  # 🔹 Replace with your PostgreSQL username
            password="Sakthi@547",  # 🔹 Replace with your PostgreSQL password
            host="localhost",      # ✅ Your database host
            port="5432"            # ✅ Default PostgreSQL port
        )
    except psycopg2.OperationalError as e:
        logger.error(f"Database connection error: {e}")
        return None

@api_view(["GET"])
def get_tables(request):
    """
    Fetch all tables from the 'bi_dwh' schema.
    """
    try:
        conn = get_connection()
        if not conn:
            return Response({"error": "Unable to connect to database"}, status=500)

        cursor = conn.cursor()
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'bi_dwh';")
        tables = [row[0] for row in cursor.fetchall()]
        return Response({"tables": tables})
    except Exception as e:
        logger.error(f"Error fetching tables: {e}")
        return Response({"error": str(e)}, status=500)
    finally:
        if conn:
            conn.close()

@api_view(["GET"])
def get_table_data(request):
    """
    Fetch all data and columns from the specified table.
    """
    table_name = request.GET.get("table")
    if not table_name:
        return Response({"error": "Table name is required"}, status=400)

    try:
        conn = get_connection()
        if not conn:
            return Response({"error": "Unable to connect to the database"}, status=500)

        cursor = conn.cursor()
        query = sql.SQL("SELECT * FROM {}.{}").format(
            sql.Identifier('bi_dwh'),
            sql.Identifier(table_name)
        )
        cursor.execute(query)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]

        return Response({"columns": columns, "rows": rows})
    except Exception as e:
        logger.error(f"Error fetching table data: {e}")
        return Response({"error": str(e)}, status=500)
    finally:
        if conn:
            conn.close()
