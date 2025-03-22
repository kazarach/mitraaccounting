from django.db import models

class Warehouse(models.Model):
    gudang_name = models.CharField(max_length=100)
    gudang_code = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.gudang_name

    class Meta:
        verbose_name = "Warehouse"
        verbose_name_plural = "Warehouses"