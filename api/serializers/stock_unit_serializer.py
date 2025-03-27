from rest_framework import serializers
from ..models import StockUnit

class StockUnitSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    
    class Meta:
        model = StockUnit
        fields = ['id', 'unit', 'unit_name', 'conversion', 'is_base_unit']