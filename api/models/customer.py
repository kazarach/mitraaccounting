from django.db import models
from django.contrib.auth.models import User
from .member_type import MemberType
from django.conf import settings
from .stock_price import PriceCategory

class Customer(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    telp = models.CharField(max_length=50, blank=True, null=True)
    contact = models.CharField(max_length=100, blank=True, null=True)
    npwp = models.CharField(max_length=50, blank=True, null=True)

    price_category = models.ForeignKey(PriceCategory, on_delete=models.SET_NULL, 
                                     related_name='customers',
                                     blank=True, null=True)
    
    discount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    discount_type = models.CharField(max_length=20, blank=True, null=True)
    due_period = models.IntegerField(blank=True, null=True)
    member_type = models.ForeignKey(MemberType, on_delete=models.SET_NULL, blank=True, null=True)
    active = models.BooleanField(default=True)

    point = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    customer_date = models.DateField(blank=True, null=True)
    duedate = models.DateField(blank=True, null=True)
    changed = models.DateTimeField(auto_now=True)
    
    credit_term_days = models.IntegerField(default=14)
    
    def __str__(self):
        return self.name
    def get_point_history(self, start_date=None, end_date=None):
        """
        Get customer's point transaction history with optional date filtering
        
        Args:
            start_date (datetime, optional): Start date for filtering
            end_date (datetime, optional): End date for filtering
            
        Returns:
            QuerySet: Point transactions for this customer
        """
        transactions = self.point_transactions.all().order_by('-created_at')
        
        if start_date:
            transactions = transactions.filter(created_at__gte=start_date)
        
        if end_date:
            transactions = transactions.filter(created_at__lte=end_date)
            
        return transactions

    def adjust_points(self, points, note="Manual adjustment", user=None):
        """
        Manually adjust customer's points (can be positive or negative)
        
        Args:
            points (Decimal): Points to add (positive) or subtract (negative)
            note (str): Reason for adjustment
            user (User): User making the adjustment
            
        Returns:
            PointTransaction: The created point transaction
        """
        from decimal import Decimal
        from .point_transaction import PointTransaction, PointTransactionType
        
        points = Decimal(str(points))
        
        # Update customer balance
        self.point += points
        self.save(update_fields=['point'])
        
        # Create transaction record
        return PointTransaction.objects.create(
            customer=self,
            transaction=None,
            points=points,
            transaction_type=PointTransactionType.ADJUSTED,
            balance_after=self.point,
            created_by=user,
            note=note
        )

    def check_expired_points(self):
        """
        Check for expired points and process them
        Should be called by a scheduled task periodically
        """
        from django.utils import timezone
        from .point_transaction import PointTransaction, PointTransactionType
        
        # Find all transactions with expiry_date in the past that haven't been processed
        today = timezone.now()
        expired_points = self.point_transactions.filter(
            expiry_date__lt=today,
            transaction_type=PointTransactionType.EARNED  # Only earned points expire
        )
        
        total_expired = 0
        for tx in expired_points:
            # Mark the points as expired
            PointTransaction.objects.create(
                customer=self,
                transaction=tx.transaction,
                points=-tx.points,  # Negative because we're removing points
                transaction_type=PointTransactionType.EXPIRED,
                balance_after=self.point - total_expired - tx.points,
                note=f"Points from transaction {tx.transaction.th_code if tx.transaction else 'manual'} expired"
            )
            total_expired += tx.points
        
        # Update customer balance if any points expired
        if total_expired > 0:
            self.point -= total_expired
            self.save(update_fields=['point'])
            
        return total_expired
    
    class Meta:
        verbose_name = "Customer"
        verbose_name_plural = "Customers"

