from django.db import models

class Rack(models.Model):
    rack_code = models.CharField(max_length=50, unique=True)
    rack_name = models.CharField(max_length=100)

    def __str__(self):
        return self.rack_name

    class Meta:
        verbose_name = "Rack"
        verbose_name_plural = "Racks"