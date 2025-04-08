from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from .supplier import Supplier
from .customer import Customer
from .bank import Bank
from .event_discount import EventDisc
from .sales import Sales
from .stock import Stock
from django.conf import settings


class TransactionHistory(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, blank=True, null=True)
    
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="cashier_transactions")  # For tracking cashier
    
    th_number = models.CharField(max_length=50, unique=True)
    th_type = models.CharField(max_length=50)
    th_payment_type = models.CharField(max_length=50, blank=True, null=True)
    
    th_disc = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_ppn = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_round = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_dp = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    th_total = models.DecimalField(max_digits=15, decimal_places=2)
    
    th_date = models.DateTimeField(default=timezone.now)
    th_note = models.TextField(blank=True, null=True)
    th_status = models.BooleanField(default=True)
    
    bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, blank=True, null=True)
    event_discount = models.ForeignKey(EventDisc, on_delete=models.SET_NULL, blank=True, null=True)
    
    th_so = models.ForeignKey(Sales, on_delete=models.SET_NULL, blank=True, null=True, related_name="sales_orders")
    th_retur = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name="returns")  # Self-referencing for returns
    
    th_delivery = models.BooleanField(default=False)
    th_post = models.BooleanField(default=False)
    
    th_point = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_point_nominal = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.th_number

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
