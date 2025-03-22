from rest_framework import serializers
from ..models import StockPrice

class StockPriceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = StockPrice
        fields = ['id', 'category', 'category_name', 'margin', 'margin_type', 
                  'price_sell', 'is_default', 'start_date', 'end_date', 'allow_below_cost']