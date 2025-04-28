from django.db import models
from ..models.category import Category
from ..models.rack import Rack
from ..models.supplier import Supplier
from ..models.unit import Unit
from ..models.warehouse import Warehouse
from ..models.transaction_history import TransItemDetail

class Stock(models.Model):
    code = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    name = models.CharField(max_length=255)
    
    quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    price_buy = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    margin = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    hpp = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    min_stock = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    max_stock = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, blank=True, null=True)
    rack = models.ForeignKey(Rack, on_delete=models.SET_NULL, blank=True, null=True)

    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    is_online = models.BooleanField(default=False)
    # last_buy_date = models.DateTimeField(blank=True, null=True)
    # last_sell_date = models.DateTimeField(blank=True, null=True)
    # Unit handling - each Stock has a unit
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, 
                             blank=True, null=True, related_name='stocks')
    
    # Relationship between different packagings of the same product
    parent_stock = models.ForeignKey('self', on_delete=models.SET_NULL, 
                                     blank=True, null=True, related_name='child_stocks')
    parent_conversion = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True,
                                        help_text="Conversion rate from this unit to parent unit")
    
    def __str__(self):
        if self.unit:
            return f"{self.name} ({self.unit.name})"
        return self.name
        
    def get_available_quantity(self):
        return self.quantity
        
    def is_low_stock(self):
        return self.quantity < self.min_stock if self.min_stock is not None else False

    def update_margin_from_sell_price(self, sell_price):
        if self.hpp > 0:
            margin_amount = sell_price - self.hpp
            self.margin = (margin_amount / self.hpp) * 100
            self.save(update_fields=['margin'])
            return True
        return False

    def is_really_active(self):
        return self.is_active and (self.category is None or self.category.spc_status)

    def is_really_online(self):
        return self.is_online and (self.category is None or getattr(self.category, 'spc_online', True))
    
    def last_buy(self):
        """
        Returns the date of the last purchase transaction for this stock.
        
        Returns:
            str or None: String representation of the date of the last purchase,
                        or None if no purchase transaction exists.
        """
        from django.db.models import Q
        
        # Find the last purchase transaction
        last_buy_item = TransItemDetail.objects.filter(
            stock=self,
            transaction__th_type='PURCHASE',
            transaction__th_status=True
        ).select_related('transaction').order_by('-transaction__th_date').first()
        
        if last_buy_item:
            # Return formatted date string
            return last_buy_item.transaction.th_date.strftime('%Y-%m-%d')
        return None

    def last_sell(self):
        """
        Returns the date of the last sale transaction for this stock.
        
        Returns:
            str or None: String representation of the date of the last sale,
                        or None if no sale transaction exists.
        """
        # Find the last sale transaction
        last_sell_item = TransItemDetail.objects.filter(
            stock=self,
            transaction__th_type='SALE',
            transaction__th_status=True
        ).select_related('transaction').order_by('-transaction__th_date').first()
        
        if last_sell_item:
            # Return formatted date string
            return last_sell_item.transaction.th_date.strftime('%Y-%m-%d')
        return None
    # def get_last_transaction_dates(self):
    #     """
    #     Returns just the dates of the last buy and sell transactions for this stock item.
        
    #     Returns:
    #         dict: A dictionary containing last_buy_date and last_sell_date
    #     """
    #     from django.db import models
        
    #     # Find the last buy transaction date (PURCHASE type)
    #     last_buy_date = TransItemDetail.objects.filter(
    #         stock=self,
    #         transaction__th_type='PURCHASE',
    #         transaction__th_status=True
    #     ).select_related('transaction').order_by('-transaction__th_date').values_list(
    #         'transaction__th_date', flat=True).first()
        
    #     # Find the last sell transaction date (SALE type)
    #     last_sell_date = TransItemDetail.objects.filter(
    #         stock=self,
    #         transaction__th_type='SALE',
    #         transaction__th_status=True
    #     ).select_related('transaction').order_by('-transaction__th_date').values_list(
    #         'transaction__th_date', flat=True).first()
        
    #     return {
    #         'last_buy_date': last_buy_date,
    #         'last_sell_date': last_sell_date
    #     }

    # def days_since_last_transaction(self):
    #     """
    #     Calculate the number of days since the last buy and sell transactions.
        
    #     Returns:
    #         dict: A dictionary containing days since last buy and last sell
    #     """
    #     import datetime
    #     from django.utils import timezone
        
    #     transaction_dates = self.get_last_transaction_dates()
    #     today = timezone.now().date()
    #     result = {}
        
    #     if transaction_dates['last_buy_date']:
    #         last_buy_date = transaction_dates['last_buy_date'].date()
    #         result['days_since_last_buy'] = (today - last_buy_date).days
    #     else:
    #         result['days_since_last_buy'] = None
        
    #     if transaction_dates['last_sell_date']:
    #         last_sell_date = transaction_dates['last_sell_date'].date()
    #         result['days_since_last_sell'] = (today - last_sell_date).days
    #     else:
    #         result['days_since_last_sell'] = None
        
    #     return result
    
    # def update_last_transaction_dates(self):
    #     """
    #     Updates the stock with the dates of the last transactions.
        
    #     Returns:
    #         bool: True if updated successfully, False otherwise
    #     """
    #     dates = self.get_last_transaction_dates()
    #     updated = False
    
    #     if dates['last_buy_date'] and (not self.last_buy_date or dates['last_buy_date'] > self.last_buy_date):
    #         self.last_buy_date = dates['last_buy_date']
    #         updated = True
        
    #     if dates['last_sell_date'] and (not self.last_sell_date or dates['last_sell_date'] > self.last_sell_date):
    #         self.last_sell_date = dates['last_sell_date']
    #         updated = True
        
    #     if updated:
    #         self.save(update_fields=['last_buy_date', 'last_sell_date'])
        
    #     return updated
    
    # AUTO CONV - unchanged from your current code
    def get_related_stocks(self):
        """Get all stocks related to this one (parent, siblings, children)"""
        related = []
        
        # Get the top parent
        top_parent = self
        while top_parent.parent_stock is not None:
            top_parent = top_parent.parent_stock
            
        # Add the top parent and all its descendants
        if top_parent != self:
            related.append(top_parent)
        
        # Add siblings and children
        related.extend(list(top_parent.child_stocks.all()))
        
        return [stock for stock in related if stock != self]
    
    def convert_from(self, other_stock, quantity):
        """Convert quantity from another related stock unit to this stock unit"""
        if other_stock == self:
            return quantity
            
        # Find the conversion path
        if self.parent_stock == other_stock:
            # Direct child-to-parent conversion
            return quantity / self.parent_conversion if self.parent_conversion else 0
        elif other_stock.parent_stock == self:
            # Direct parent-to-child conversion
            return quantity * other_stock.parent_conversion if other_stock.parent_conversion else 0
        else:
            # Need to go through the hierarchy
            base_quantity = other_stock.convert_to_base_unit(quantity)
            return self.convert_from_base_unit(base_quantity)
            
    def convert_to_base_unit(self, quantity):
        """Convert quantity to the base unit (top parent)"""
        if self.parent_stock is None:
            return quantity
        
        current = self
        result = quantity
        
        # Traverse up the hierarchy, applying conversions
        while current.parent_stock is not None:
            result = result / current.parent_conversion if current.parent_conversion else result
            current = current.parent_stock
            
        return result
        
    def convert_from_base_unit(self, base_quantity):
        """Convert quantity from base unit to this unit"""
        if self.parent_stock is None:
            return base_quantity
            
        # Calculate the full conversion factor from base to this unit
        current = self
        
        # Collect all conversion factors going up the chain
        factors = []
        while current.parent_stock is not None:
            factors.append(current.parent_conversion)
            current = current.parent_stock
            
        # Apply conversions in reverse order
        result = base_quantity
        for factor in reversed(factors):
            result = result * factor if factor else result
            
        return result
        
    def handle_automatic_conversion(self, quantity_change):
        """
        Handle automatic conversion from related stocks when this would go negative
        Returns True if successful, False if not enough stock available
        """
        new_quantity = self.quantity + quantity_change
        
        if new_quantity >= 0:
            return True
            
        # Try to convert from related stocks
        shortage = abs(new_quantity)
        related_stocks = self.get_related_stocks()
        
        for related in related_stocks:
            # How much of the related stock do we need?
            needed_in_related = self.convert_from(related, shortage)
            
            if related.quantity >= needed_in_related:
                # We can convert from this related stock
                
                # Reduce the related stock
                related.quantity -= needed_in_related
                related.save(update_fields=['quantity'])
                
                # Increase this stock
                self.quantity += shortage
                self.save(update_fields=['quantity'])
                
                return True
                
        return False
    
    # Add a method to update stock with auto-conversion if needed
    def update_quantity(self, quantity_change):
        """Update stock quantity with automatic conversion if needed"""
        if self.quantity + quantity_change < 0:
            # Will go negative, try automatic conversion
            if not self.handle_automatic_conversion(quantity_change):
                return False  # Not enough stock available
        else:
            self.quantity += quantity_change
            self.save(update_fields=['quantity'])
        return True
    
    class Meta:
        verbose_name = "Stock"
        verbose_name_plural = "Stocks"
        indexes = [
            models.Index(fields=['barcode']),
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]