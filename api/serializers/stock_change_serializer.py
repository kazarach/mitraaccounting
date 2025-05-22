from rest_framework import serializers
from decimal import Decimal
from .stock_serializer import StockSerializer  # Import your existing serializer

class StockChangeSerializer(serializers.Serializer):
    stock_id = serializers.IntegerField()
    stock_code = serializers.CharField()
    stock_name = serializers.CharField()
    
    # Transaction summaries
    total_in = serializers.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    total_out = serializers.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    net_change = serializers.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    
    # Price information
    latest_buy_price = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    latest_sell_price = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    
    # Transaction details
    transactions = serializers.ListField(child=serializers.DictField(), allow_empty=True)
    
    # Optional: Include full stock details using your existing serializer
    stock_details = serializers.SerializerMethodField()
    
    def get_stock_details(self, obj):
        """Include full stock details if requested"""
        if hasattr(self.context.get('view'), 'include_stock_details') and self.context['view'].include_stock_details:
            try:
                from ..models import Stock
                stock = Stock.objects.get(id=obj['stock_id'])
                return StockSerializer(stock, context=self.context).data
            except Stock.DoesNotExist:
                return None
        return None

class StockChangeDetailSerializer(serializers.Serializer):
    transaction_id = serializers.IntegerField()
    transaction_code = serializers.CharField()
    transaction_type = serializers.CharField()
    transaction_time = serializers.DateTimeField()
    quantity = serializers.DecimalField(max_digits=15, decimal_places=2)
    stock_quantity = serializers.DecimalField(max_digits=15, decimal_places=2)
    stock_changed_to = serializers.DecimalField(max_digits=15, decimal_places=2)
    buy_price = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    sell_price = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    customer = serializers.CharField(allow_null=True)
    supplier = serializers.CharField(allow_null=True)