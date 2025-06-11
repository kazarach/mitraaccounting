from django.db import models
from .supplier import Supplier
from .customer import Customer  # You'll need this model
from .transaction_history import TransactionHistory

class ARAP(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True)
    is_receivable = models.BooleanField()
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    total_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    def remaining_amount(self):
        return self.total_amount - self.total_paid
    
    def is_settled(self):
        return self.total_paid >= self.total_amount
    
    def __str__(self):
        entity = self.customer if self.is_receivable else self.supplier
        entity_name = entity.name if entity else "Unknown"
        type_str = "Piutang" if self.is_receivable else "Hutang"
        return f"{type_str} - {entity_name}"
    
    class Meta:
        verbose_name = "ARAP"
        verbose_name_plural = "ARAPs"
        
class ARAPTransaction(models.Model):
    transaction_history = models.OneToOneField(TransactionHistory, on_delete=models.CASCADE, related_name="arap_transaction")
    arap = models.ForeignKey(ARAP, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_settled(self):
        return self.paid >= self.amount
    
    def remaining_amount(self):
        return self.amount - self.paid
    
    def __str__(self):
        return f"Transaction {self.id} for {self.arap}"