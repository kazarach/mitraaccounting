from django.db import models
from django.utils import timezone
from .transaction_history import TransactionHistory

class TransRetur(models.Model):
    th = models.ForeignKey(TransactionHistory, on_delete=models.CASCADE)
    tr_ori_id = models.IntegerField(blank=True, null=True)  # Original transaction ID
    prh_id = models.IntegerField(blank=True, null=True)  # PR History ID
    tr_total = models.DecimalField(max_digits=15, decimal_places=2)

    def __str__(self):
        return f"Return {self.id} - {self.th.th_number}"

    class Meta:
        verbose_name = "Transaction Return"
        verbose_name_plural = "Transaction Returns"