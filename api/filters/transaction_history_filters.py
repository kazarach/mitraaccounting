# filters.py (inside your app)

import django_filters
from ..models import TransactionHistory


class TransactionHistoryFilter(django_filters.FilterSet):
    start_date = django_filters.DateFilter(field_name="th_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="th_date", lookup_expr='lte')

    class Meta:
        model = TransactionHistory
        fields = [
            'th_type',
            'th_status',
            'cashier',
            'supplier',
            'customer',
            'bank',
            'event_discount',
            'th_delivery',
            'th_post',
            'th_so',
            'start_date',
            'end_date',
        ]
