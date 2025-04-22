from django.db import models
from django.utils import timezone
from .transaction_history import TransactionHistory

class AccountType(models.TextChoices):
    ASSET = 'ASSET', 'Asset'
    LIABILITY = 'LIABILITY', 'Liability'
    EQUITY = 'EQUITY', 'Equity'
    REVENUE = 'REVENUE', 'Revenue'
    EXPENSE = 'EXPENSE', 'Expense'

class Account(models.Model):
    account_number = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    #TIPE ACC
    account_type = models.CharField(max_length=20,choices=AccountType.choices,default=AccountType.ASSET)
    # NAH INI KE PARENT BUAT HIERARCHICAL
    parent_account = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,related_name='sub_accounts')
    
    
    is_active = models.BooleanField(default=True)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.account_number} - {self.name}"
    
    class Meta:
        ordering = ['account_number']
        indexes = [
            models.Index(fields=['account_number']),
            models.Index(fields=['account_type']),
        ]

class JournalEntry(models.Model):
    transaction = models.ForeignKey('TransactionHistory', on_delete=models.CASCADE, related_name='journal_entries')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='journal_entries')
    description = models.CharField(max_length=255)
    debit_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    credit_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    date = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.transaction.th_code} - {self.account.name} - {self.date}"
    
    class Meta:
        verbose_name = "Journal Entry"
        verbose_name_plural = "Journal Entries"
        indexes = [
            models.Index(fields=['date']),
        ]