from rest_framework import serializers
from ..models import Stock
from .stock_unit_serializer import StockUnitSerializer
from .stock_assembly_serializer import StockAssemblySerializer
from .stock_price_serializer import StockPriceSerializer

class StockSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    rack_name = serializers.CharField(source='rack.name', read_only=True)
    default_unit_name = serializers.CharField(source='default_unit.name', read_only=True)
    is_low_stock = serializers.SerializerMethodField()
    available_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Stock
        fields = ['id', 'code', 'barcode', 'name', 'quantity', 'margin', 'hpp', 
                  'price_buy', 'min_stock', 'max_stock', 'supplier', 'supplier_name',
                  'warehouse', 'warehouse_name', 'category', 'category_name',
                  'rack', 'rack_name', 'updated_at', 'is_active', 'is_online',
                  'default_unit', 'default_unit_name', 'is_low_stock', 'available_quantity']
    
    def get_is_low_stock(self, obj):
        return obj.is_low_stock()
    
    def get_available_quantity(self, obj):
        return obj.get_available_quantity()

class StockDetailSerializer(StockSerializer):
    units = StockUnitSerializer(many=True, read_only=True)
    assemblies = StockAssemblySerializer(many=True, read_only=True)
    sales_prices = StockPriceSerializer(many=True, read_only=True)
    
    class Meta(StockSerializer.Meta):
        fields = StockSerializer.Meta.fields + ['units', 'assemblies', 'sales_prices']