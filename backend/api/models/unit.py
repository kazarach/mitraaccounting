from django.db import models

class Unit(models.Model):
    unit_code = models.CharField(max_length=20, unique=True)
    unit_name = models.CharField(max_length=50)

    def __str__(self):
        return self.unit_name

    class Meta:
        verbose_name = "Unit"
        verbose_name_plural = "Units"