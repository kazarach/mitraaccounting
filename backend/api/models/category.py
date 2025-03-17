from django.db import models
from mptt.models import MPTTModel, TreeForeignKey

class Category(MPTTModel):
    category_name = models.CharField(max_length=100, unique=True)
    category_code = models.CharField(max_length=50, unique=True)
    parent = TreeForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')

    class MPTTMeta:
        order_insertion_by = ['category_name']

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.category_name
