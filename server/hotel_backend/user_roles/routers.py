class SecondDbRouter:
    """
    A router to control all database operations on models for different databases
    """
    route_app_labels = {'craveon'}  # Add this if you create a separate app

    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'craveon':
            return 'SystemInteg'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == 'craveon':
            return 'SystemInteg'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == 'craveon':
            return db == 'SystemInteg'
        return db != 'SystemInteg'