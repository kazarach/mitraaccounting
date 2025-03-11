from django.db import models
from django.utils import timezone
from .transaction_history import TransactionHistory
from .operator import Operator
from .bank import Bank

class PR(models.Model):
    th = models.ForeignKey(TransactionHistory, on_delete=models.CASCADE)
    pr_type = models.CharField(max_length=50)

class PRReturn(models.Model):
    retur_id = models.IntegerField(blank=True, null=True)
    th = models.ForeignKey(TransactionHistory, on_delete=models.CASCADE)
    prr_total = models.DecimalField(max_digits=15, decimal_places=2)
    prr_from = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"PR Return {self.id} - {self.th.th_number}"

    class Meta:
        verbose_name = "PR Return"
        verbose_name_plural = "PR Returns"
        
class PRHistory(models.Model):
    pr = models.ForeignKey(PR, on_delete=models.CASCADE, related_name='history')
    operator = models.ForeignKey(Operator, on_delete=models.SET_NULL, blank=True, null=True)
    pr_history_type = models.CharField(max_length=50, blank=True, null=True)
    pr_history_amount = models.DecimalField(max_digits=15, decimal_places=2)
    pr_history_date = models.DateTimeField(default=timezone.now)
    pr_history_payment = models.CharField(max_length=50, blank=True, null=True)
    bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, blank=True, null=True)
    pr_history_note = models.TextField(blank=True, null=True)
    pr_history_status = models.CharField(max_length=20, blank=True, null=True)
    th = models.ForeignKey(TransactionHistory, on_delete=models.SET_NULL, blank=True, null=True)
    bank_number = models.CharField(max_length=100, blank=True, null=True)
    pr_history_note2 = models.TextField(blank=True, null=True)
    prm_id = models.IntegerField(blank=True, null=True)
    pr_mass_id = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"PR History {self.id} - {self.pr.id}"

    class Meta:
        verbose_name = "PR History"
        verbose_name_plural = "PR Histories"

    