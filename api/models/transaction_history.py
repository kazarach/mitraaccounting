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
from .account import Account
from django.conf import settings
from ..utils.journal_utils import create_journal_entries_for_transaction

class TransactionType(models.Model):
    code = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    def __str__(self):
        return self.label

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
    th_type = models.ForeignKey(TransactionType, on_delete=models.SET_NULL, null=True)
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

    from_account = models.ForeignKey(Account, on_delete=models.SET_NULL, blank=True, null=True, related_name='transfers_out')
    to_account = models.ForeignKey(Account, on_delete=models.SET_NULL, blank=True, null=True, related_name='transfers_in')

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
    
    def should_create_payment_record(self):
        """
        Determine if this transaction should automatically create a payment record.
        """
        # List of transaction type codes that should trigger payment creation
        payment_creating_type_codes = [
            "SALE",
            "PURCHASE",
            "RETURN_SALE",
            "RETURN_PURCHASE",
            "EXPENSE"
        ]
        
        # Skip if credit type (payment will happen later)
        if self.th_payment_type == PaymentType.CREDIT:
            return False

        # Check if type code is in the list and has a valid amount
        return (
            self.th_type 
            and self.th_type.code in payment_creating_type_codes 
            and self.th_total 
            and self.th_total > 0
        )

    def create_automatic_payment_record(self, is_new=True):
        """
        Automatically create a payment record for this transaction.
        """
        if not self.should_create_payment_record():
            return None

        from .payment_record import Payment  # Avoid circular import

        # Mapping by transaction code string instead of model constant
        payment_type_mapping = {
            "SALE": "INITIAL",
            "PURCHASE": "INITIAL",
            "RETURN_SALE": "RETURN",
            "RETURN_PURCHASE": "RETURN",
            "PAYMENT": "ADDITIONAL",
            "EXPENSE": "INITIAL",
        }

        payment_method_mapping = {
            PaymentType.BANK: "BANK_TRANSFER",
            PaymentType.CASH: "CASH",
            PaymentType.CREDIT: "CREDIT",
        }

        transaction_code = getattr(self.th_type, "code", None)
        if not transaction_code:
            return None

        # Determine payment amount
        payment_amount = self.th_dp
        if transaction_code == "RETURN_SALE":
            payment_amount = -abs(payment_amount)
        elif transaction_code == "RETURN_PURCHASE":
            payment_amount = abs(payment_amount)

        arap_transaction = getattr(self, "arap_transaction", None)

        # Check if similar payment already exists
        existing_payment = (
            Payment.objects.filter(
                transaction=arap_transaction,
                payment_type=payment_type_mapping.get(transaction_code, "INITIAL"),
                amount=payment_amount,
            ).first()
            if arap_transaction else None
        )
        if existing_payment:
            return existing_payment

        # Notes based on transaction type
        customer_name = self.customer.name if self.customer else "Unknown Customer"
        supplier_name = self.supplier.name if self.supplier else "Unknown Supplier"
        notes_mapping = {
            "SALE": f"Pembayaran oleh {customer_name}",
            "PURCHASE": f"Pembayaran kepada {supplier_name}",
            "RETURN_SALE": f"Return kepada {customer_name}",
            "RETURN_PURCHASE": f"Return oleh {supplier_name}",
            "PAYMENT": f"Pembayaran tambahan oleh" + (
                f" - {customer_name}" if self.customer else f" - {supplier_name}" if self.supplier else ""
            ),
            "EXPENSE": f"Pengeluaran untuk {self.th_code}",
        }

        payment_status = "PENDING" if self.th_payment_type == PaymentType.CREDIT else "COMPLETED"

        # Create new payment
        return Payment.objects.create(
            transaction=arap_transaction,
            arap=arap_transaction.arap if arap_transaction else None,
            supplier=self.supplier,
            customer=self.customer,
            payment_type=payment_type_mapping.get(transaction_code, "INITIAL"),
            amount=payment_amount,
            payment_method=payment_method_mapping.get(self.th_payment_type),
            bank=self.bank,
            operator=self.cashier,
            payment_date=self.th_date,
            notes=notes_mapping.get(transaction_code, f"Auto-generated payment record for {self.th_code}"),
            status=payment_status,
        )

    def save(self, *args, **kwargs):
        is_new = not self.pk
        original_point = None

        if not is_new:
            try:
                original = TransactionHistory.objects.get(pk=self.pk)
                original_point = original.th_point
            except TransactionHistory.DoesNotExist:
                pass

        # Normalize th_date
        if isinstance(self.th_date, datetime):
            th_date_aware = self.th_date
        elif isinstance(self.th_date, date):
            th_date_aware = datetime.combine(self.th_date, time.min)
        else:
            th_date_aware = timezone.now()

        if timezone.is_naive(th_date_aware):
            th_date_aware = timezone.make_aware(th_date_aware)

        self.th_date = th_date_aware

        super().save(*args, **kwargs)  # Save first to ensure PK exists

        # Generate th_code if not set (after save to get PK)
        if not self.th_code:
            type = self.th_type
            prefix = "TRX"
            if type:
                prefix_map = {
                    "SALE": "SAL",
                    "PURCHASE": "PUR",
                    "RETURN_SALE": "RTS",
                    "RETURN_PURCHASE": "RTP",
                    "USAGE": "USG",
                    "TRANSFER": "TRF",
                    "PAYMENT": "PAY",
                    "RECEIPT": "REC",
                    "ADJUSTMENT": "ADJ",
                    "EXPENSE": "EXP",
                    "ORDERIN": "OIN",
                    "ORDEROUT": "OOU",
                }
                prefix = prefix_map.get(type.code, "TRX")

            date_str = timezone.now().strftime('%Y%m%d')
            base_code = f"{prefix}-{date_str}-"
            existing_codes = TransactionHistory.objects.filter(
                th_code__startswith=base_code
            ).values_list('th_code', flat=True)

            max_seq = 0
            for code in existing_codes:
                try:
                    seq = int(code[-4:])
                    max_seq = max(max_seq, seq)
                except:
                    pass

            new_seq = max_seq + 1
            self.th_code = f"{base_code}{new_seq:04d}"

            while TransactionHistory.objects.filter(th_code=self.th_code).exists():
                new_seq += 1
                self.th_code = f"{base_code}{new_seq:04d}"

            # Save updated th_code
            TransactionHistory.objects.filter(pk=self.pk).update(th_code=self.th_code)

        # Calculate and update th_point
        if not self.th_point:
            self.th_point = self.calculate_points()
            if self.th_point is not None:
                TransactionHistory.objects.filter(pk=self.pk).update(th_point=self.th_point)

        # Update th_total based on items
        calculated_total = sum(item.netto for item in self.items.all())
        if calculated_total != self.th_total:
            self.th_total = calculated_total
            TransactionHistory.objects.filter(pk=self.pk).update(th_total=self.th_total)

        # Handle point transactions (only for first type)
        main_type = self.th_type
        if main_type and main_type.code == "SALE" and self.customer and self.th_point:
            from .point_transaction import PointTransaction, PointTransactionType

            if is_new or (original_point != self.th_point):
                self.customer.point += self.th_point
                self.customer.save(update_fields=["point"])
                PointTransaction.objects.create(
                    customer=self.customer,
                    transaction=self,
                    points=self.th_point,
                    transaction_type=PointTransactionType.EARNED,
                    balance_after=self.customer.point,
                    note=f"Points earned from transaction {self.th_code}",
                )

        elif main_type and main_type.code == "RETURN_SALE" and self.customer and self.th_return_reference:
            from .point_transaction import PointTransaction, PointTransactionType

            if hasattr(self.th_return_reference, "th_point") and self.th_return_reference.th_point:
                points_to_deduct = -self.th_return_reference.th_point
                self.customer.point += points_to_deduct
                self.customer.save(update_fields=["point"])
                PointTransaction.objects.create(
                    customer=self.customer,
                    transaction=self,
                    points=points_to_deduct,
                    transaction_type=PointTransactionType.ADJUSTED,
                    balance_after=self.customer.point,
                    note=f"Points adjusted due to sales return {self.th_code}",
                )

        # Create journal entries (only for relevant types)
        if main_type and main_type.code in [
            "SALE", "PURCHASE", "RETURN_SALE", "RETURN_PURCHASE", "EXPENSE", "TRANSFER"
        ]:
            create_journal_entries_for_transaction(self)


    def get_payment_balance(self):
        """
        Calculate the remaining balance for this transaction.
        """
        total_payments = sum(payment.amount for payment in self.payments.all())
        return (self.th_total or 0) - total_payments

    def is_fully_paid(self):
        """
        Check if this transaction is fully paid.
        """
        return self.get_payment_balance() <= 0.01
    
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
        trans_type = self.transaction.th_type.code if self.transaction.th_type else None

        if trans_type in ["SALE", "RETURN_SALE", "ORDERIN"]:
            is_return = trans_type == "RETURN_SALE"
            sign = -1 if is_return else 1
            self.quantity *= sign
            self.stock_quantity = self.stock.quantity + self.quantity

            price_category = self.transaction.customer.price_category if self.transaction.customer else None
            if price_category:
                stock_price = StockPrice.objects.filter(stock=self.stock, price_category=price_category).first()
                self.sell_price = stock_price.price_sell if stock_price else self.stock.hpp
            else:
                self.sell_price = self.stock.hpp

            self.total = self.quantity * (self.sell_price or 0)

            # Apply discounts
            price = (self.sell_price or 0) - (self.disc or 0)
            price *= (1 - (self.disc_percent or 0) / 100)
            price *= (1 - (self.disc_percent2 or 0) / 100)
            netto = self.quantity * price

            if self.transaction.th_disc:
                netto *= (1 - self.transaction.th_disc / 100)
            if self.transaction.th_ppn:
                netto *= (1 + self.transaction.th_ppn / 100)

            self.netto = netto
            self.sell_price = self.netto / self.quantity if self.quantity > 0 else 0

        elif trans_type in ["PURCHASE", "RETURN_PURCHASE", "ORDEROUT"]:
            is_return = trans_type == "RETURN_PURCHASE"
            sign = -1 if is_return else 1
            self.quantity *= sign
            self.stock_quantity = self.stock.quantity + self.quantity

            self.total = self.quantity * (self.stock_price_buy or 0)
            price = (self.stock_price_buy or 0) - (self.disc or 0)
            price *= (1 - (self.disc_percent or 0) / 100)
            price *= (1 - (self.disc_percent2 or 0) / 100)
            netto = self.quantity * price

            if self.transaction.th_disc:
                netto *= (1 - self.transaction.th_disc / 100)
            if self.transaction.th_ppn:
                netto *= (1 + self.transaction.th_ppn / 100)

            self.netto = netto

            if trans_type == "PURCHASE" and self.quantity > 0:
                self.stock.hpp = self.netto / self.quantity
                self.stock.save()

        elif trans_type == "ADJUSTMENT":
            adjustment_price = self.stock.hpp
            self.stock_price_buy = adjustment_price
            self.stock_quantity = self.stock.quantity + self.quantity
            self.total = self.quantity * adjustment_price
            self.netto = self.total

            if hasattr(self.stock, 'quantity'):
                self.stock.quantity = self.stock_quantity
                self.stock.save()

        super().save(*args, **kwargs)
