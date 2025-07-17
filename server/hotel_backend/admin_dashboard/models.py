from django.db import models
from property.models import Rooms, Areas

# Create your models here.
class ArchivedUser(models.Model):
    user_id = models.IntegerField()
    email = models.EmailField()
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=50)
    archived_at = models.DateTimeField(auto_now_add=True)
    archived_by = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'archived_users'
