from django.db import models
from django.contrib.postgres.fields import JSONField

class Privilege(models.Model):
    privilege_name = models.CharField(max_length=100)
    privilege_note = models.TextField(blank=True, null=True)
    privilege_permission = JSONField(blank=True, null=True)

    def __str__(self):
        return self.privilege_name

    class Meta:
        verbose_name = "Privilege"
        verbose_name_plural = "Privileges"