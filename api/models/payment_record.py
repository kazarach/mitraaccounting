from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from .transaction_history import TransactionHistory
from .bank import Bank
from django.conf import settings

class PR(models.Model):
    th = models.ForeignKey(TransactionHistory, on_delete=models.CASCADE)
    pr_type = models.CharField(max_length=50)
    
    def __str__(self):
        return f"Payment Record {self.id} - {self.pr_type}"
    
    class Meta:
        verbose_name = "Payment Record"
        verbose_name_plural = "Payment Records"

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
    payment_record = models.ForeignKey(PR, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    payment_record_history_type = models.CharField(max_length=50, blank=True, null=True)
    payment_record_history_amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_record_history_date = models.DateTimeField(default=timezone.now)
    payment_record_history_payment = models.CharField(max_length=50, blank=True, null=True)
    bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, blank=True, null=True)
    payment_record_history_note = models.TextField(blank=True, null=True)
    payment_record_history_status = models.CharField(max_length=20, blank=True, null=True)
    transaction_history = models.ForeignKey(TransactionHistory, on_delete=models.SET_NULL, blank=True, null=True)
    bank_number = models.CharField(max_length=100, blank=True, null=True)
    payment_record_history_note2 = models.TextField(blank=True, null=True)
    payment_record_m_id = models.IntegerField(blank=True, null=True)
    payment_record_mass_id = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"PR History {self.id} - {self.pr.id}"

    class Meta:
        verbose_name = "PR History"
        verbose_name_plural = "PR Histories"