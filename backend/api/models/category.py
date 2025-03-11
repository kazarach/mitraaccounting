from django.db import models

class Category(models.Model):
    category_name = models.CharField(max_length=100)
    category_code = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.category_name

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"


class SubCategory(models.Model):
    sub_category_name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')

    def __str__(self):
        return self.sub_category_name

    class Meta:
        verbose_name = "Sub Category"
        verbose_name_plural = "Sub Categories"