# filters/stock_filters.py

import django_filters
from ..models import Stock

class StockFilter(django_filters.FilterSet):
    class Meta:
        model = Stock
        fields = [
            'is_active', 
            'is_online', 
            'category', 
            'supplier', 
            'warehouse', 
            'rack', 
            'unit']
