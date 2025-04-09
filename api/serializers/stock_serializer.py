from rest_framework import serializers
from ..models import Stock
from .stock_assembly_serializer import StockAssemblySerializer
from .stock_price_serializer import StockPriceSerializer

class StockSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    rack_name = serializers.CharField(source='rack.name', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    parent_stock_name = serializers.CharField(source='parent_stock.name', read_only=True)
    is_low_stock = serializers.SerializerMethodField()
    available_quantity = serializers.SerializerMethodField()
    is_really_active = serializers.SerializerMethodField()
    is_really_online = serializers.SerializerMethodField()
    
    class Meta:
        model = Stock
        fields = ['id', 'code', 'barcode', 'name', 'quantity', 'margin', 'hpp', 
                  'price_buy', 'min_stock', 'max_stock', 'supplier', 'supplier_name',
                  'warehouse', 'warehouse_name', 'category', 'category_name',
                  'rack', 'rack_name', 'updated_at', 'is_active', 'is_online',
                  'unit', 'unit_name', 'parent_stock', 'parent_stock_name', 
                  'parent_conversion', 'is_low_stock', 'available_quantity',
                  'is_really_active', 'is_really_online']
    
    def get_is_low_stock(self, obj):
        return obj.is_low_stock()
    
    def get_available_quantity(self, obj):
        return obj.get_available_quantity()
    
    def get_is_really_active(self, obj):
        return obj.is_really_active()
    
    def get_is_really_online(self, obj):
        return obj.is_really_online()

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