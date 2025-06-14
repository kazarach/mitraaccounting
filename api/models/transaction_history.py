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
    ORDERIN = 'ORDERIN', 'Order in'
    ORDEROUT = 'ORDEROUT', 'Order out'

class PaymentType(models.TextChoices):
    BANK = 'BANK', 'Bank'
    CASH = 'CASH', 'Cash'
    CREDIT = 'CREDIT', 'Credit'

class TransactionHistory(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, blank=True, null=True)
    # price_category = models.ForeignKey(PriceCategory, on_delete=models.SET_NULL, blank=True, null=True)

    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="cashier_transactions")  # For tracking cashier
    
    th_code = models.CharField(max_length=50, unique=True, blank=True)
    th_type = models.CharField(max_length=50, choices=TransactionType.choices)
    th_payment_type = models.CharField(max_length=50, choices=PaymentType.choices)
    
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
    th_delivery = models.BooleanField(default=False)
    
    # th_so = models.ForeignKey(Sales, on_delete=models.SET_NULL, blank=True, null=True, related_name="sales_orders")
    th_return = models.BooleanField(default=False)
    th_return_reference = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name="returns")
    th_order = models.BooleanField(default=False)
    th_order_reference = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True)

    th_point = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    th_status = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): 
        return self.th_code
    
    EXCLUDED_CATEGORIES = ["ROKOK"]

    def calculate_points(self):
        """
        Calculate points based on transaction items, excluding items in specific categories.
        """
        if not self.pk:  # Skip if we don't have a primary key yet
            return None
            
        total_amount = 0
        # Loop through each item in the transaction and calculate the total amount
        for item in self.items.all():
            if item.stock.category not in self.EXCLUDED_CATEGORIES:  # Exclude items in these categories
                total_amount += item.sell_price * item.quantity
        
        # Calculate points: every 100000 = 2 points
        points = (total_amount // 100000) * 2
        return points

    def save(self, *args, **kwargs):
        # Store original point value to detect changes
        is_new = not self.pk
        original_point = None
        
        if not is_new:
            try:
                original = TransactionHistory.objects.get(pk=self.pk)
                original_point = original.th_point
            except TransactionHistory.DoesNotExist:
                pass
        
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

        # Generate th_code based on transaction type and date if not already set
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
            date_str = today.strftime('%Y%m%d')
            
            # Find the highest sequence number for this type and date
            today_codes = TransactionHistory.objects.filter(
                th_type=self.th_type,
                th_date__date=today,
                th_code__startswith=f"{prefix}-{date_str}-"
            ).values_list('th_code', flat=True)
            
            max_sequence = 0
            for code in today_codes:
                try:
                    # Extract the sequence number part (last 4 digits)
                    sequence_str = code[-4:]
                    sequence = int(sequence_str)
                    if sequence > max_sequence:
                        max_sequence = sequence
                except (ValueError, IndexError):
                    # Skip if format is incorrect
                    pass
            
            # Generate the new code with incremented sequence
            new_sequence = max_sequence + 1
            self.th_code = f"{prefix}-{date_str}-{new_sequence:04d}"
            
            # As an extra safety measure, verify uniqueness
            base_code = f"{prefix}-{date_str}-"
            attempt = new_sequence
            while TransactionHistory.objects.filter(th_code=self.th_code).exists():
                attempt += 1
                self.th_code = f"{base_code}{attempt:04d}"

        # First save to ensure we have a primary key
        super().save(*args, **kwargs)
        
        # Now that we have a primary key, we can work with related objects
        if self.pk:
            # Calculate points if not set
            if not self.th_point:  
                self.th_point = self.calculate_points()
                if self.th_point is not None:
                    # Use update_fields to avoid triggering a full save again
                    TransactionHistory.objects.filter(pk=self.pk).update(th_point=self.th_point)
            
            # Calculate th_total only if we have related items
            calculated_total = sum(item.netto for item in self.items.all())
            if calculated_total != self.th_total:
                self.th_total = calculated_total
                # Use update_fields to avoid triggering a full save again
                TransactionHistory.objects.filter(pk=self.pk).update(th_total=self.th_total)
                
            # Create point transaction record if this is a sale and customer exists
            # and we have points to add (either new transaction or updated points)
            if self.th_type == TransactionType.SALE and self.customer and self.th_point:
                should_create_point_transaction = is_new or (original_point != self.th_point)
                
                if should_create_point_transaction:
                    from .point_transaction import PointTransaction, PointTransactionType
                    
                    # Update customer's point balance
                    self.customer.point += self.th_point
                    self.customer.save(update_fields=['point'])
                    
                    # Create point transaction record
                    PointTransaction.objects.create(
                        customer=self.customer,
                        transaction=self,
                        points=self.th_point,
                        transaction_type=PointTransactionType.EARNED,
                        balance_after=self.customer.point,
                        note=f"Points earned from transaction {self.th_code}"
                    )
                    
            # For sales returns, deduct points if applicable
            elif self.th_type == TransactionType.RETURN_SALE and self.customer and self.th_return_reference:
                if hasattr(self.th_return_reference, 'th_point') and self.th_return_reference.th_point:
                    from .point_transaction import PointTransaction, PointTransactionType
                    
                    # Points to deduct are the original points from the sale being returned
                    points_to_deduct = -self.th_return_reference.th_point
                    
                    # Update customer's point balance
                    self.customer.point += points_to_deduct  # Adding negative points = deduction
                    self.customer.save(update_fields=['point'])
                    
                    # Create point transaction record for the deduction
                    PointTransaction.objects.create(
                        customer=self.customer,
                        transaction=self,
                        points=points_to_deduct,
                        transaction_type=PointTransactionType.ADJUSTED,
                        balance_after=self.customer.point,
                        note=f"Points adjusted due to sales return {self.th_code}"
                    )

    def redeem_points(self, points_to_redeem, user=None):
        """
        Redeem customer points for this transaction
        
        Args:
            points_to_redeem (Decimal): Number of points to redeem
            user (User, optional): The user performing the redemption
            
        Returns:
            bool: True if redemption successful, False otherwise
        """
        from decimal import Decimal
        from .point_transaction import PointTransaction, PointTransactionType
        
        # Validation
        if not self.customer:
            return False
            
        if not self.pk:
            raise ValueError("Transaction must be saved before redeeming points")
            
        points_to_redeem = Decimal(str(points_to_redeem))  # Ensure Decimal type
        
        # Make sure customer has enough points
        if self.customer.point < points_to_redeem:
            return False
            
        # Make sure points are positive
        if points_to_redeem <= 0:
            return False
            
        # Update customer's point balance
        self.customer.point -= points_to_redeem
        self.customer.save(update_fields=['point'])
        
        # Create point transaction record
        PointTransaction.objects.create(
            customer=self.customer,
            transaction=None,  # No earning transaction 
            redemption_transaction=self,  # This is where points are used
            points=-points_to_redeem,  # Negative because points are being used
            transaction_type=PointTransactionType.REDEEMED,
            balance_after=self.customer.point,
            created_by=user,
            note=f"Points redeemed for transaction {self.th_code}"
        )
        
        return True
    
    
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
    quantity = models.DecimalField(max_digits=15, decimal_places=2)

    stock_quantity = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    stock_price_buy = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    stock_price_order = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    
    sell_price = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, default=0)
    disc = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, default=0)
    disc_percent = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, default=0)
    disc_percent2 = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, default=0)
    total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    netto = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    stock_note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.transaction.th_code} - {self.stock.stock_name}"
    
    def save(self, *args, **kwargs):
        if self.transaction.th_type in [TransactionType.SALE, TransactionType.RETURN_SALE, TransactionType.ORDERIN]:
            is_return = self.transaction.th_type == TransactionType.RETURN_SALE
            sign = -1 if is_return else 1
            self.quantity = self.quantity * sign
            self.stock_quantity = self.stock.quantity + self.quantity

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
            self.total = self.quantity * (self.sell_price or 0)
            price_after_disc = (self.sell_price or 0) - (self.disc or 0)
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
            

        elif self.transaction.th_type in [TransactionType.PURCHASE, TransactionType.RETURN_PURCHASE, TransactionType.ORDEROUT]:
            # Code block for buying (only for PURCHASE transactions)
            is_return = self.transaction.th_type == TransactionType.RETURN_PURCHASE
            sign = -1 if is_return else 1
            self.quantity = self.quantity * sign
            self.stock_quantity = self.stock.quantity + self.quantity

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

            if self.transaction.th_type == TransactionType.PURCHASE:
                if self.quantity > 0:
                    final_price_buy = self.netto / self.quantity
                else:
                    final_price_buy = 0

                self.stock.hpp = final_price_buy
                self.stock.save()


        elif self.transaction.th_type == TransactionType.ADJUSTMENT:
            adjustment_price = self.stock.hpp
            self.stock_price_buy = adjustment_price
            self.stock_quantity = self.stock.quantity + self.quantity

            self.total = self.quantity * adjustment_price
            self.netto = self.total

            if hasattr(self.stock, 'quantity'):
                self.stock.quantity = self.stock_quantity
                self.stock.save()

        super().save(*args, **kwargs)


    class Meta:
        verbose_name = "Transaction Item Detail"
        verbose_name_plural = "Transaction Item Details"


