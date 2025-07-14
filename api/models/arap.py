from django.db import models
from django.utils import timezone
from decimal import Decimal
from .bank import Bank
from .supplier import Supplier
from .customer import Customer
from .transaction_history import TransactionHistory
from .account import Account, JournalEntry

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
    
    def add_payment(self, transaction: 'ARAPTransaction', amount, payment_method='CASH', bank=None, notes='', operator=None):
        """
        Pay a specific ARAPTransaction.
        """
        from decimal import Decimal
        from django.utils import timezone
        from .payment_record import Payment

        amount = Decimal(str(amount))

        if transaction.arap != self:
            raise ValueError("Transaction does not belong to this ARAP")

        if amount <= 0:
            raise ValueError("Payment amount must be positive")

        remaining = transaction.remaining_amount()
        if amount > remaining:
            raise ValueError(f"Amount exceeds remaining transaction balance: {remaining}")

        # Create payment
        payment = Payment.objects.create(
            arap=self,
            transaction=transaction,
            payment_type='ADDITIONAL',
            amount=amount,
            payment_method=payment_method,
            bank=bank,
            operator=operator,
            payment_date=timezone.now().date(),
            notes=notes or f"Payment for transaction {transaction.id}",
            status='COMPLETED'
        )

        # Apply to transaction
        transaction.paid += amount
        transaction.save()

        # Update ARAP
        self.total_paid += amount
        self.save()

        return payment

    def get_payment_schedule(self):
        """
        Get all unpaid transactions with their due dates
        """
        return self.transactions.filter(
            paid__lt=models.F('amount')
        ).order_by('due_date')
    
    def get_overdue_amount(self):
        """
        Calculate total overdue amount
        """
        from decimal import Decimal
        from django.utils import timezone
        today = timezone.now().date()
        
        overdue_transactions = self.transactions.filter(
            due_date__lt=today,
            paid__lt=models.F('amount')
        )
        
        total_overdue = Decimal('0.00')
        for transaction in overdue_transactions:
            total_overdue += transaction.remaining_amount()
        
        return total_overdue
    
    def allocate_payment(self, arap, amount, allocation_strategy='FIFO', arap_transaction_id=None):
        """
        Helper method to allocate payment across multiple transactions or a specific transaction.
        """
        from django.core.exceptions import ObjectDoesNotExist
        from decimal import Decimal
        from django.db.models import F

        remaining_payment = Decimal(str(amount))
        updated_transactions = []

        if arap_transaction_id:
            try:
                transaction = arap.transactions.get(id=arap_transaction_id)
            except ObjectDoesNotExist:
                return {
                    'error': f'Transaction with ID {arap_transaction_id} not found in this ARAP',
                    'allocated_amount': Decimal('0.00'),
                    'remaining_payment': remaining_payment,
                    'updated_transactions': []
                }

            transaction_remaining = transaction.amount - transaction.paid
            payment_for_this = min(remaining_payment, transaction_remaining)

            transaction.paid += payment_for_this
            transaction.is_closed = transaction.remaining_amount() <= 99
            transaction.save()

            remaining_payment -= payment_for_this
            updated_transactions.append({
                'transaction': transaction,
                'payment_amount': payment_for_this
            })

        else:
            # Get unpaid transactions based on strategy
            if allocation_strategy == 'FIFO':
                unpaid_transactions = arap.transactions.filter(paid__lt=F('amount')).order_by('created_at')
            elif allocation_strategy == 'DUE_DATE':
                unpaid_transactions = arap.transactions.filter(paid__lt=F('amount')).order_by('due_date')
            else:
                unpaid_transactions = arap.transactions.filter(paid__lt=F('amount')).order_by('id')

            for transaction in unpaid_transactions:
                if remaining_payment <= 0:
                    break

                transaction_remaining = transaction.amount - transaction.paid
                payment_for_this = min(remaining_payment, transaction_remaining)

                transaction.paid += payment_for_this
                transaction.is_closed = transaction.remaining_amount() <= 99
                transaction.save()

                remaining_payment -= payment_for_this
                updated_transactions.append({
                    'transaction': transaction,
                    'payment_amount': payment_for_this
                })

        return {
            'allocated_amount': amount - remaining_payment,
            'remaining_payment': remaining_payment,
            'updated_transactions': updated_transactions
        }

    
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
    amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
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