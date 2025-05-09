import django_filters
from ..models import TransactionHistory, TransItemDetail, Supplier


class TransactionHistoryFilter(django_filters.FilterSet):
    start_date = django_filters.DateFilter(field_name="th_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="th_date", lookup_expr='lte')
    supplier = django_filters.CharFilter(method='filter_supplier_with_children')
    cashier = django_filters.CharFilter(method='filter_multiple_cashiers')
    customer = django_filters.CharFilter(method='filter_multiple_customers')
    bank = django_filters.CharFilter(method='filter_multiple_banks')
    th_so = django_filters.CharFilter(field_name='th_so', method='filter_multiple_th_sos')

    class Meta:
        model = TransactionHistory
        fields = [
            'th_type',
            'th_payment_type',
            'th_status',
            'cashier',
            'supplier',
            'customer',
            'bank',
            'event_discount',
            'th_delivery',
            'th_order',
            'th_so',
            'start_date',
            'end_date',
        ]
    
    def filter_supplier_with_children(self, queryset, name, value):
        # Value can be comma-separated IDs like "4,5"
        supplier_root_ids = [int(id_str) for id_str in value.split(',') if id_str.strip().isdigit()]
        
        if not supplier_root_ids:
            return queryset.none()
        
        all_supplier_ids = []
        for root_id in supplier_root_ids:
            try:
                supplier = Supplier.objects.get(pk=root_id)
                # Get IDs of supplier and all its descendants
                supplier_ids = [s.id for s in supplier.get_descendants(include_self=True)]
                all_supplier_ids.extend(supplier_ids)
            except Supplier.DoesNotExist:
                # Skip invalid IDs
                continue
        
        # Remove duplicates
        all_supplier_ids = list(set(all_supplier_ids))
        
        if all_supplier_ids:
            return queryset.filter(supplier_id__in=all_supplier_ids)
        return queryset.none()

    def _parse_multiple_ids(self, value):
        """Helper method to parse comma-separated ID strings"""
        try:
            return [int(id_str) for id_str in value.split(',') if id_str.strip().isdigit()]
        except:
            return []
    
    def filter_multiple_cashiers(self, queryset, name, value):
        cashier_ids = self._parse_multiple_ids(value)
        if cashier_ids:
            return queryset.filter(cashier_id__in=cashier_ids)
        return queryset
    
    def filter_multiple_customers(self, queryset, name, value):
        customer_ids = self._parse_multiple_ids(value)
        if customer_ids:
            return queryset.filter(customer_id__in=customer_ids)
        return queryset
    
    def filter_multiple_banks(self, queryset, name, value):
        bank_ids = self._parse_multiple_ids(value)
        if bank_ids:
            return queryset.filter(bank_id__in=bank_ids)
        return queryset
    
    def filter_multiple_th_sos(self, queryset, name, value):
        th_so_ids = self._parse_multiple_ids(value)
        if th_so_ids:
            return queryset.filter(th_so_id__in=th_so_ids)
        return queryset
    
class TransactionItemDetailFilter(django_filters.FilterSet):
    date = django_filters.DateFilter(field_name='transaction__th_date')
    date_min = django_filters.DateFilter(field_name='transaction__th_date', lookup_expr='gte')
    date_max = django_filters.DateFilter(field_name='transaction__th_date', lookup_expr='lte')

    class Meta:
        model = TransItemDetail
        fields = [
            'stock_code', 
            'stock_name', 
            'stock', 
            'transaction']
