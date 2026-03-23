# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from .entity_cache import load_entities_from_db

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(lambda: load_entities_from_db(force=True), 'interval', hours=24)
    scheduler.start()
    print("🔄 Entity refresh scheduler started (every 24h)")
