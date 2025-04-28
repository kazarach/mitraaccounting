from rest_framework import serializers
from ..models import StockPrice

class StockPriceSerializer(serializers.ModelSerializer):
    price_category_name = serializers.CharField(source='price_category.name', read_only=True)
    
    class Meta:
        model = StockPrice
        fields = ['id', 'price_category', 'price_category_name', 'margin', 'margin_type', 
                  'price_sell', 'is_default', 'start_date', 'end_date', 'allow_below_cost']