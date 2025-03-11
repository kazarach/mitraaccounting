from django.db import models

class MyIndex(models.Model):
    mi_name = models.CharField(max_length=100, unique=True)
    mi_value = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.mi_name

    class Meta:
        verbose_name = "My Index"
        verbose_name_plural = "My Indexes"