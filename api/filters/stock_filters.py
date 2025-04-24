import django_filters
from ..models import Stock, Supplier, Category

class StockFilter(django_filters.FilterSet):
    warehouse = django_filters.CharFilter(method='filter_multiple_warehouses')
    rack = django_filters.CharFilter(method='filter_multiple_racks')
    unit = django_filters.CharFilter(method='filter_multiple_units')

    category = django_filters.CharFilter(method='filter_category_with_children')
    supplier = django_filters.CharFilter(method='filter_supplier_with_children')

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
        
    def _parse_multiple_ids(self, value):
        """Helper method to parse comma-separated ID strings"""
        try:
            return [int(id_str) for id_str in value.split(',') if id_str.strip().isdigit()]
        except:
            return []
    
    def filter_multiple_warehouses(self, queryset, name, value):
        warehouse_ids = self._parse_multiple_ids(value)
        if warehouse_ids:
            return queryset.filter(warehouse_id__in=warehouse_ids)
        return queryset
    
    def filter_multiple_racks(self, queryset, name, value):
        rack_ids = self._parse_multiple_ids(value)
        if rack_ids:
            return queryset.filter(rack_id__in=rack_ids)
        return queryset
    
    def filter_multiple_units(self, queryset, name, value):
        unit_ids = self._parse_multiple_ids(value)
        if unit_ids:
            return queryset.filter(unit_id__in=unit_ids)
        return queryset

    def filter_supplier_with_children(self, queryset, name, value):
        # Value can be comma-separated IDs like "4,5"
        supplier_root_ids = self._parse_multiple_ids(value)
        
        if not supplier_root_ids:
            return queryset
        
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
        return queryset
    
    def filter_category_with_children(self, queryset, name, value):
        # Value can be comma-separated IDs like "4,5"
        category_root_ids = self._parse_multiple_ids(value)
        
        if not category_root_ids:
            return queryset
        
        all_category_ids = []
        for root_id in category_root_ids:
            try:
                category = Category.objects.get(pk=root_id)
                # Get IDs of category and all its descendants
                category_ids = [s.id for s in category.get_descendants(include_self=True)]
                all_category_ids.extend(category_ids)
            except Category.DoesNotExist:
                # Skip invalid IDs
                continue
        
        # Remove duplicates
        all_category_ids = list(set(all_category_ids))
        
        if all_category_ids:
            return queryset.filter(category_id__in=all_category_ids)
        return queryset