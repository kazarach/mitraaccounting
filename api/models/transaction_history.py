from django.db import models
from django.utils import timezone
from datetime import datetime, date, time  
from django.contrib.auth.models import User
from .supplier import Supplier
from .customer import Customer
from .bank import Bank
from .event_discount import EventDisc
from .sales import Sales
from .stock import Stock
from django.conf import settings

class TransactionType(models.TextChoices):
    SALE = 'SALE', 'Sale'
    PURCHASE = 'PURCHASE', 'Purchase'
    RETURN_SALE = 'RETURN_SALE', 'Sales Return'
    RETURN_PURCHASE = 'RETURN_PURCHASE', 'Purchase Return'
    USAGE = 'USAGE', 'Internal Usage'
    TRANSFER = 'TRANSFER', 'Transfer'
    PAYMENT = 'PAYMENT', 'Payment'
    RECEIPT = 'RECEIPT', 'Receipt'
    ADJUSTMENT = 'ADJUSTMENT', 'Adjustment'
    EXPENSE = 'EXPENSE', 'Expense'
    
class TransactionHistory(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, blank=True, null=True)
    
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="cashier_transactions")  # For tracking cashier
    
    th_number = models.CharField(max_length=50, unique=True)
    th_type = models.CharField(max_length=50, choices=TransactionType.choices)
    th_payment_type = models.CharField(max_length=50, blank=True, null=True)
    
    th_disc = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_ppn = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_round = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_dp = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    th_total = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    
    th_date = models.DateTimeField(default=timezone.now)
    th_note = models.TextField(blank=True, null=True)
    th_status = models.BooleanField(default=True)
    
    bank = models.ForeignKey('Bank', on_delete=models.SET_NULL, blank=True, null=True)
    event_discount = models.ForeignKey(EventDisc, on_delete=models.SET_NULL, blank=True, null=True)
    
    th_so = models.ForeignKey(Sales, on_delete=models.SET_NULL, blank=True, null=True, related_name="sales_orders")
    th_retur = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name="returns")  # Self-referencing for returns
    
    th_delivery = models.BooleanField(default=False)
    th_post = models.BooleanField(default=False)
    
    th_point = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): 
        return self.th_number
    
    EXCLUDED_CATEGORIES = ["ROKOK"]

    def calculate_points(self):
        """
        Calculate points based on transaction items, excluding items in specific categories.
        """
        total_amount = 0
        # Loop through each item in the transaction and calculate the total amount
        for item in self.items.all():
            if item.stock.category not in self.EXCLUDED_CATEGORIES:  # Exclude items in these categories
                total_amount += item.sell_price * item.quantity
        
        # Calculate points: every 100000 = 2 points
        points = (total_amount // 100000) * 2
        return points

    def save(self, *args, **kwargs):
        # Ensure th_date is a datetime object (combine with midnight time if it's a date object)
        if isinstance(self.th_date, datetime):
            th_date_aware = self.th_date
        elif isinstance(self.th_date, date):  # Use 'date' from datetime module
            th_date_aware = datetime.combine(self.th_date, time.min)
        else:
            th_date_aware = timezone.now()

        # Make sure the datetime object is timezone-aware
        if timezone.is_naive(th_date_aware):
            th_date_aware = timezone.make_aware(th_date_aware)

        # Assign the aware datetime to th_date
        self.th_date = th_date_aware

        # Save the transaction first without calculating points
        super().save(*args, **kwargs)
        
        # After the transaction is saved and has a primary key, calculate points
        if not self.th_point:  # Only calculate points if it's not already set
            self.th_point = self.calculate_points()
            # Save the transaction again to update the points
            super().save(*args, **kwargs)


    class Meta:
        verbose_name = "Transaction History"
        verbose_name_plural = "Transaction Histories"
        indexes = [
            models.Index(fields=['th_date']),
            models.Index(fields=['th_status']),
        ]

class TransItemDetail(models.Model):
    transaction = models.ForeignKey(TransactionHistory, on_delete=models.CASCADE, related_name='items')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='transaction_items')
    
    stock_code = models.CharField(max_length=50)
    stock_name = models.CharField(max_length=255)
    stock_price_buy = models.DecimalField(max_digits=15, decimal_places=2)

    quantity = models.DecimalField(max_digits=15, decimal_places=2)
    sell_price = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, default=0)

    def __str__(self):
        return f"{self.transaction.th_number} - {self.stock.stock_name}"

    class Meta:
        verbose_name = "Transaction Item Detail"
        verbose_name_plural = "Transaction Item Details"

class ARAP(models.Model):
    transaction = models.OneToOneField(TransactionHistory, on_delete=models.CASCADE, related_name='arap')
    
    is_receivable = models.BooleanField()  # True = Piutang (receivable), False = Hutang (payable)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    due_date = models.DateField(null=True, blank=True)
    is_settled = models.BooleanField(default=False)

    def remaining_amount(self):
        return self.total_amount - self.amount_paid

    def save(self, *args, **kwargs):
        self.is_settled = self.amount_paid >= self.total_amount
        super().save(*args, **kwargs)

    def __str__(self):
        type_str = "Piutang" if self.is_receivable else "Hutang"
        return f"{type_str} - {self.transaction.th_number}"

    class Meta:
        verbose_name = "ARAP"
        verbose_name_plural = "ARAPs"
