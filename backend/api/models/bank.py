from django.db import models
from .account import Account

class Bank(models.Model):
    bank_code = models.CharField(max_length=50, unique=True)
    bank_name = models.CharField(max_length=100)
    bank_type = models.CharField(max_length=50, blank=True, null=True)
    bank_cb = models.CharField(max_length=50, blank=True, null=True)
    bank_active = models.BooleanField(default=True)
    acc = models.ForeignKey(Account, on_delete=models.SET_NULL, blank=True, null=True)

    def __str__(self):
        return self.bank_name

    class Meta:
        verbose_name = "Bank"
        verbose_name_plural = "Banks"