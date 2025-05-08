from django.db import models, transaction
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, date, time  
from django.contrib.auth.models import User
from .supplier import Supplier
from .customer import Customer
from .bank import Bank
from .event_discount import EventDisc
from .sales import Sales
from .stock import Stock
from .stock_price import PriceCategory, StockPrice
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
    # price_category = models.ForeignKey(PriceCategory, on_delete=models.SET_NULL, blank=True, null=True)

    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="cashier_transactions")  # For tracking cashier
    
    th_code = models.CharField(max_length=50, unique=True, blank=True)
    th_type = models.CharField(max_length=50, choices=TransactionType.choices)
    th_payment_type = models.CharField(max_length=50, blank=True, null=True)
    
    th_disc = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_ppn = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_dp = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    th_total = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    # th_round = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)

    th_date = models.DateTimeField(default=timezone.now)
    th_note = models.TextField(blank=True, null=True)
    th_due_date = models.DateTimeField(null=True, blank=True)

    bank = models.ForeignKey('Bank', on_delete=models.SET_NULL, blank=True, null=True)
    event_discount = models.ForeignKey(EventDisc, on_delete=models.SET_NULL, blank=True, null=True)
    
    th_so = models.ForeignKey(Sales, on_delete=models.SET_NULL, blank=True, null=True, related_name="sales_orders")
    th_retur = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name="returns")  # Self-referencing for returns
    
    th_status = models.BooleanField(default=True)
    th_delivery = models.BooleanField(default=False)
    th_order = models.BooleanField(default=False)
    
    th_point = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): 
        return self.th_code
    
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
        elif isinstance(self.th_date, date):  
            th_date_aware = datetime.combine(self.th_date, time.min)
        else:
            th_date_aware = timezone.now()

        # Make sure the datetime object is timezone-aware
        if timezone.is_naive(th_date_aware):
            th_date_aware = timezone.make_aware(th_date_aware)

        # Assign the aware datetime to th_date
        self.th_date = th_date_aware

        # Use a transaction to ensure atomic behavior
        with transaction.atomic():
            # Generate th_code based on transaction type and date
            if not self.th_code:
                prefix_map = {
                    TransactionType.SALE: "SAL",
                    TransactionType.PURCHASE: "PUR",
                    TransactionType.RETURN_SALE: "RTS",
                    TransactionType.RETURN_PURCHASE: "RTP",
                    TransactionType.USAGE: "USG",
                    TransactionType.TRANSFER: "TRF",
                    TransactionType.PAYMENT: "PAY",
                    TransactionType.RECEIPT: "REC",
                    TransactionType.ADJUSTMENT: "ADJ",
                    TransactionType.EXPENSE: "EXP",
                    TransactionType.ORDERIN: "OIN",
                    TransactionType.ORDEROUT: "OOU",
                }
                prefix = prefix_map.get(self.th_type, "TRX")  # Default to "TRX" if no match
                today = timezone.now().date()
                count_today = TransactionHistory.objects.filter(
                    th_type=self.th_type,
                    th_date__date=today
                ).count()
                self.th_code = f"{prefix}-{today.strftime('%Y%m%d')}-{count_today + 1:04d}"

            # Save the transaction first
            super().save(*args, **kwargs)

            # Calculate points only if not already set, and avoid duplicate saves
            if not self.th_point:  
                self.th_point = self.calculate_points()
                super().save(update_fields=["th_point"])  # Update only the points field

            # Calculate th_total by summing netto from all related TransItemDetails
            self.th_total = sum(item.netto for item in self.items.all())

            # Save the updated th_total value
            super().save(update_fields=["th_total"])

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
    disc = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, default=0)
    disc_percent = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, default=0)
    disc_percent2 = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, default=0)
    total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    netto = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.transaction.th_code} - {self.stock.stock_name}"
    
    def save(self, *args, **kwargs):
        if self.transaction.th_type == TransactionType.SALE:
            price_category = self.transaction.customer.price_category if self.transaction.customer else None
            if price_category:
                # Retrieve the selling price based on the price category for the stock
                stock_price = StockPrice.objects.filter(
                    stock_id=self.stock,
                    price_category_id=price_category
                ).first()

                if stock_price:
                    self.sell_price = stock_price.price_sell  # Set the price_sell based on price category
                else:
                    self.sell_price = self.stock.hpp  # Fallback to stock's hpp if no stock price is found
            else:
                self.sell_price = self.stock.hpp
                
            # Code block for selling (only for SALE transactions)
            self.total = self.quantity * (self.stock_price_buy or 0)
            price_after_disc = (self.stock_price_buy or 0) - (self.disc or 0)
            price_after_disc1 = (price_after_disc or Decimal(0)) * (Decimal(1) - Decimal(self.disc_percent or 0) / Decimal(100))
            price_after_disc2 = price_after_disc1 * (Decimal(1) - Decimal(self.disc_percent2 or 0) / Decimal(100))
            
            netto = self.quantity * price_after_disc2

            if self.transaction.th_disc:
                netto -= netto * (self.transaction.th_disc / 100)

            if self.transaction.th_ppn:
                netto += netto * (self.transaction.th_ppn / 100)

            self.netto = netto

            if self.quantity > 0:
                final_price_sell = self.netto / self.quantity
            else:
                final_price_sell = 0
            
            self.sell_price = final_price_sell
            

        elif self.transaction.th_type == TransactionType.PURCHASE:
            # Code block for buying (only for PURCHASE transactions)
            self.total = self.quantity * (self.stock_price_buy or 0)
            price_after_disc = (self.stock_price_buy or 0) - (self.disc or 0)
            price_after_disc1 = (price_after_disc or Decimal(0)) * (Decimal(1) - Decimal(self.disc_percent or 0) / Decimal(100))
            price_after_disc2 = price_after_disc1 * (Decimal(1) - Decimal(self.disc_percent2 or 0) / Decimal(100))
            
            netto = self.quantity * price_after_disc2

            if self.transaction.th_disc:
                netto -= netto * (self.transaction.th_disc / 100)

            if self.transaction.th_ppn:
                netto += netto * (self.transaction.th_ppn / 100)

            self.netto = netto

            if self.quantity > 0:
                final_price_buy = self.netto / self.quantity
            else:
                final_price_buy = 0
            
            # For purchasing, set the stock's hpp based on the purchase price
            self.stock.hpp = final_price_buy
            self.stock.save()

        super().save(*args, **kwargs)


    class Meta:
        verbose_name = "Transaction Item Detail"
        verbose_name_plural = "Transaction Item Details"


