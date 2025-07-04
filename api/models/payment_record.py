from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from .transaction_history import TransactionHistory
from .bank import Bank
from .arap import ARAP
from django.conf import settings
from .supplier import Supplier
from .customer import Customer
from .arap import ARAPTransaction

class Payment(models.Model):
    PAYMENT_TYPE_CHOICES = [
        ('INITIAL', 'Initial Payment'),
        ('ADDITIONAL', 'Additional Payment'),
        ('RETURN', 'Payment Return'),
    ]
    
    transaction = models.ForeignKey(ARAPTransaction, on_delete=models.CASCADE, null=True, blank=True)
    arap = models.ForeignKey(ARAP, on_delete=models.CASCADE, null=True, blank=True, related_name='direct_payments')
    
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, blank=True, null=True)
    payment_type = models.CharField(max_length=50, choices=PAYMENT_TYPE_CHOICES)
    
    # Original payment reference (for additional payments or returns)
    original_payment = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, 
                                         related_name='related_payments')
    
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, blank=True, null=True)
    bank_reference = models.CharField(max_length=100, blank=True, null=True)
    
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    payment_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='COMPLETED')
    
    def __str__(self):
        return f"Payment {self.id} - {self.transaction.th_code} ({self.payment_type})"
    
    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        indexes = [
            models.Index(fields=['payment_date']),
            models.Index(fields=['payment_type']),
            models.Index(fields=['status']),
        ]