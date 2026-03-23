class MultiDBRouter:
    """
    A router to control database operations for authentication (SQLite) 
    and data retrieval (PostgreSQL).
    """

    AUTH_MODELS = {'user', 'token', 'session', 'contenttype', 'group', 'permission', 'customuser', 'outstandingtoken'}

    def db_for_read(self, model, **hints):
        """Read operations: SQLite for auth, PostgreSQL for others."""
        if model._meta.model_name.lower() in self.AUTH_MODELS or model._meta.app_label == 'auth':
            return 'default'  # ✅ Read from SQLite for authentication
        return 'postgres'  # ✅ Read from PostgreSQL for data models

    def db_for_write(self, model, **hints):
        """Write operations: SQLite for auth, PostgreSQL for others."""
        if model._meta.model_name.lower() in self.AUTH_MODELS or model._meta.app_label == 'auth':
            return 'default'  # ✅ Write to SQLite for authentication
        return 'postgres'  # ✅ Write to PostgreSQL for data models

    def allow_relation(self, obj1, obj2, **hints):
        """Allow relationships if both objects are in the same database."""
        db1 = self.db_for_read(obj1.__class__)  # ✅ Get actual database name
        db2 = self.db_for_read(obj2.__class__)

        if db1 == db2:  # ✅ Ensure both objects belong to the same database
            return True
        return None  # ❌ Prevent cross-database relations

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensure migrations go to the correct database."""
        if model_name in self.AUTH_MODELS or app_label == 'auth':
            return db == 'default'  # ✅ Migrate authentication tables only in SQLite
        return db == 'postgres'  # ✅ Migrate data tables in PostgreSQL
