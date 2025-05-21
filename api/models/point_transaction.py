from django.db import models
from django.utils import timezone
from django.conf import settings

class PointTransactionType(models.TextChoices):
    EARNED = 'EARNED', 'Points Earned'
    REDEEMED = 'REDEEMED', 'Points Redeemed'
    EXPIRED = 'EXPIRED', 'Points Expired'
    ADJUSTED = 'ADJUSTED', 'Points Adjusted'
    
class PointTransaction(models.Model):
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='point_transactions')
    transaction = models.ForeignKey('TransactionHistory', on_delete=models.SET_NULL, 
                                   blank=True, null=True, related_name='point_transactions')
    
    # For tracking which transaction the points were redeemed in
    redemption_transaction = models.ForeignKey('TransactionHistory', on_delete=models.SET_NULL, 
                                             blank=True, null=True, related_name='point_redemptions')
    
    points = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=PointTransactionType.choices)
    
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    
    note = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                 blank=True, null=True, related_name="point_transactions_created")
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optional: Expiry date for points if you want to implement expiration
    expiry_date = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.customer.name} - {self.transaction_type} - {self.points} points"
    
    class Meta:
        verbose_name = "Point Transaction"
        verbose_name_plural = "Point Transactions"
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['transaction']),
            models.Index(fields=['created_at']),
            models.Index(fields=['transaction_type']),
        ]