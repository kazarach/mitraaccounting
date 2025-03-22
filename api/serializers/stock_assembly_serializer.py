from rest_framework import serializers
from ..models import StockAssembly

class StockAssemblySerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component_stock.name', read_only=True)
    
    class Meta:
        model = StockAssembly
        fields = ['id', 'component_stock', 'component_name', 'assembly_amount', 
                  'assembly_price_buy', 'unit', 'is_manual_price']