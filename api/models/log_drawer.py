from django.db import models
from django.utils import timezone

class LogDrawer(models.Model):
    ld_date = models.DateTimeField(default=timezone.now)
    ld_reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Log {self.id} - {self.ld_date}"

    class Meta:
        verbose_name = "Log Drawer"
        verbose_name_plural = "Log Drawers"