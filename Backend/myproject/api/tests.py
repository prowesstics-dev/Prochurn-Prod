

from django.test import TestCase
from .views import print_pool_status, get_db_connection
from sqlalchemy import text
import time


class DBPoolTest(TestCase):

    def test_pool_status(self):
        print_pool_status()
        self.assertTrue(True)

    def test_db_connection(self):
        engine = get_db_connection()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
        self.assertEqual(result, 1)