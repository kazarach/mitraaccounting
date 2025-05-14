from rest_framework import serializers
from ..models import Stock, StockPrice
from .stock_assembly_serializer import StockAssemblySerializer
from .stock_price_serializer import StockPriceSerializer
from django.utils import timezone
from rest_framework.exceptions import ValidationError as DRFValidationError

class StockSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    rack_name = serializers.CharField(source='rack.name', read_only=True)
    unit_name = serializers.CharField(source='unit.unit_code', read_only=True)
    parent_stock_name = serializers.CharField(source='parent_stock.name', read_only=True)
    is_low_stock = serializers.SerializerMethodField()
    available_quantity = serializers.SerializerMethodField()
    is_really_active = serializers.SerializerMethodField()
    is_really_online = serializers.SerializerMethodField()
    last_buy = serializers.SerializerMethodField()
    last_sell = serializers.SerializerMethodField()
    conversion_unit = serializers.SerializerMethodField()
    prices = StockPriceSerializer(many=True, source='sales_prices')

    class Meta:
        model = Stock
        fields = ['id', 'code', 'barcode', 'name', 'quantity', 'margin', 'hpp', 
                  'price_buy', 'min_stock', 'max_stock', 'supplier', 'supplier_name',
                  'warehouse', 'warehouse_name', 'category', 'category_name',
                  'rack', 'rack_name', 'updated_at', 'is_active', 'is_online', 'conversion_unit',
                  'unit', 'unit_name', 'parent_stock', 'parent_stock_name', 
                  'parent_conversion', 'is_low_stock', 'available_quantity',
                  'is_really_active', 'is_really_online', 'last_buy', 'last_sell',
                  'prices']
    
    def validate(self, data):
        """
        Validate all price data before creating the stock to catch any validation errors early.
        """
        prices_data = data.get('sales_prices', [])
        hpp = data.get('hpp', 0) 
        
        # Initialize price validation errors
        price_errors = []
        
        # Validate each price entry
        for index, price_data in enumerate(prices_data):
            margin = price_data.get('margin', 0)
            margin_type = price_data.get('margin_type')
            price_sell = price_data.get('price_sell', 0)
            allow_below_cost = price_data.get('allow_below_cost', False)
            price_category = price_data.get('price_category')
            
            # Calculate expected minimum price based on margin
            min_price = 0
            if margin and hpp:
                if margin_type == 'percentage':
                    min_price = float(hpp) * (1 + (float(margin) / 100))
                else:  # fixed
                    min_price = float(hpp) + float(margin)
            
            # Check if price is below cost when not allowed
            if not allow_below_cost and float(price_sell) < min_price:
                price_errors.append({
                    'index': index,
                    'price_category': price_category,
                    'error': f"The selling price ({price_sell}) is below cost price plus margin ({min_price:.2f})."
                })
            
            # Validate date range if provided
            start_date = price_data.get('start_date')
            end_date = price_data.get('end_date')
            if start_date and end_date and start_date > end_date:
                price_errors.append({
                    'index': index,
                    'price_category': price_category,
                    'error': f"Start date ({start_date}) must be before end date ({end_date})."
                })
        
        # If any price validation errors, raise them
        if price_errors:
            raise DRFValidationError({
                'prices': price_errors
            })
        
        return data
    
    def create(self, validated_data):
        prices_data = validated_data.pop('sales_prices', [])
        stock_instance = Stock.objects.create(**validated_data)

        # Create related prices
        for price_data in prices_data:
            StockPrice.objects.create(stock=stock_instance, **price_data)
        
        return stock_instance
    
    def get_is_low_stock(self, obj):
        return obj.is_low_stock()
    
    def get_available_quantity(self, obj):
        return obj.get_available_quantity()
    
    def get_is_really_active(self, obj):
        return obj.is_really_active()
    
    def get_is_really_online(self, obj):
        return obj.is_really_online()
    
    def get_last_buy(self, obj):
        return obj.last_buy()
    
    def get_last_sell(self, obj):
        return obj.last_sell()
    
    def get_conversion_unit(self, obj):
        return obj.conversion_path_with_unit(include_base=True)
    
class StockDetailSerializer(StockSerializer):
    assemblies = StockAssemblySerializer(many=True, read_only=True)
    sales_prices = StockPriceSerializer(many=True, read_only=True)
    child_stocks = serializers.SerializerMethodField()
    related_stocks = serializers.SerializerMethodField()
    
    class Meta(StockSerializer.Meta):
        fields = StockSerializer.Meta.fields + ['assemblies', 'sales_prices', 'child_stocks', 'related_stocks']
    
    def get_child_stocks(self, obj):
        children = obj.child_stocks.all()
        return StockSerializer(children, many=True).data
    
    def get_related_stocks(self, obj):
        related = obj.get_related_stocks()
        return StockSerializer(related, many=True).data