from django.db import models

class Bank(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50, blank=True, null=True)
    cb = models.CharField(max_length=50, blank=True, null=True)
    active = models.BooleanField(default=True)
    acc = models.ForeignKey('Account', on_delete=models.SET_NULL, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Bank"
        verbose_name_plural = "Banks"