from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from .transaction_history import TransactionHistory, TransactionType
from .bank import Bank
from .arap import ARAP
from django.conf import settings
from .supplier import Supplier
from .customer import Customer
from .arap import ARAPTransaction
from .account import Account
from decimal import Decimal

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

    original_payment = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='related_payments')

    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, blank=True, null=True)
    bank_reference = models.CharField(max_length=100, blank=True, null=True)

    operator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    payment_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='COMPLETED')

    transaction_history = models.ForeignKey(TransactionHistory, on_delete=models.SET_NULL, blank=True, null=True, related_name="payments")

    def __str__(self):
        return f"Payment {self.id} - {self.transaction_history.th_code if self.transaction_history else 'N/A'} ({self.payment_type})"
    
    @property
    def direction(self):
        if self.arap:
            return "Inflow" if self.arap.is_receivable else "Outflow"
        return "Unknown"

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        # Create a TransactionHistory if not yet present
        if is_new and not self.transaction_history:
            from .transaction_history import TransactionType, PaymentType

            # Determine th_type and participants
            transaction_type = TransactionType.objects.get(code='PAYMENT')
            payment_method = PaymentType.BANK if self.bank else PaymentType.CASH
            customer = self.customer
            supplier = self.supplier

            # Build TransactionHistory
            self.transaction_history = TransactionHistory.objects.create(
                customer=customer,
                supplier=supplier,
                cashier=self.operator,
                th_type=transaction_type,
                th_payment_type=payment_method,
                th_total=self.amount,
                th_date=self.payment_date,
                th_note=self.notes,
                bank=self.bank,
                th_delivery=False,
                th_return=self.payment_type == 'RETURN'
            )

        super().save(*args, **kwargs)

        # Create journal entries after saving
        if is_new:
            self.create_journal_entries()
            self._update_account_balances()

    def create_journal_entries(self):
        """Create journal entries linked to the payment's transaction history"""
        if not self.transaction_history:
            return

        from .account import JournalEntry

        is_receivable = self.arap and self.arap.is_receivable

        customer = self.customer or (self.arap.customer if self.arap else None)
        supplier = self.supplier or (self.arap.supplier if self.arap else None)

        party_name = customer.name if customer else (supplier.name if supplier else "Unknown Party")
        desc = f"{'Payment received from' if is_receivable else 'Payment to'} {party_name}"

        cash_account = self._get_cash_account()
        counter_account = self._get_accounts_receivable_account() if is_receivable else self._get_accounts_payable_account()

        # Debit and Credit entries
        JournalEntry.objects.create(
            transaction=self.transaction_history,
            account=cash_account,
            description=desc,
            debit_amount=self.amount if is_receivable else 0,
            credit_amount=0 if is_receivable else self.amount,
            date=self.payment_date
        )
        JournalEntry.objects.create(
            transaction=self.transaction_history,
            account=counter_account,
            description=desc,
            debit_amount=0 if is_receivable else self.amount,
            credit_amount=self.amount if is_receivable else 0,
            date=self.payment_date
        )

    def _get_cash_account(self):
        """Resolve or fallback to Cash account"""
        if self.bank:
            account = Account.objects.filter(account_type='ASSET', name__icontains=self.bank.name).first()
            if account:
                return account
        return Account.objects.get_or_create(
            account_number='1100',
            defaults={
                'name': 'Cash',
                'account_type': 'ASSET',
                'description': 'Default Cash account'
            }
        )[0]

    
    def _update_arap_status(self):
        """Update ARAP and ARAPTransaction paid status."""
        if self.transaction:
            self.transaction.paid += self.amount
            self.transaction.save()

        if self.arap:
            self.arap.total_paid += self.amount
            self.arap.save()

    def _get_accounts_receivable_account(self):
        return Account.objects.get_or_create(
            account_number='1200',
            defaults={
                'name': 'Accounts Receivable',
                'account_type': 'ASSET',
                'description': 'AR from customers'
            }
        )[0]

    def _get_accounts_payable_account(self):
        return Account.objects.get_or_create(
            account_number='2100',
            defaults={
                'name': 'Accounts Payable',
                'account_type': 'LIABILITY',
                'description': 'AP to suppliers'
            }
        )[0]

    def _update_account_balances(self):
        """Recalculate balances for involved accounts"""
        for entry in self.transaction_history.journal_entries.all():
            acc = entry.account
            if entry.debit_amount > 0:
                if acc.account_type in ['ASSET', 'EXPENSE']:
                    acc.balance += entry.debit_amount
                else:
                    acc.balance -= entry.debit_amount
            elif entry.credit_amount > 0:
                if acc.account_type in ['LIABILITY', 'EQUITY', 'REVENUE']:
                    acc.balance += entry.credit_amount
                else:
                    acc.balance -= entry.credit_amount
            acc.save()

    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        indexes = [
            models.Index(fields=['payment_date']),
            models.Index(fields=['payment_type']),
            models.Index(fields=['status']),
            models.Index(fields=['transaction_history']),
        ]
