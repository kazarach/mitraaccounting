import django_filters
from django.db.models import Sum, Count, F, ExpressionWrapper, DecimalField, Q, Case, When, Value, IntegerField
from django.db.models.functions import Coalesce
from ..models import Stock, Supplier, Category, TransactionHistory, TransItemDetail, TransactionType


class StockFilter(django_filters.FilterSet):
    warehouse = django_filters.CharFilter(method='filter_multiple_warehouses')
    rack = django_filters.CharFilter(method='filter_multiple_racks')
    unit = django_filters.CharFilter(method='filter_multiple_units')

    category = django_filters.CharFilter(method='filter_category_with_children')
    supplier = django_filters.CharFilter(method='filter_supplier_with_children')
    
    # New filters for stock summary features
    is_low_stock = django_filters.BooleanFilter(method='filter_low_stock')
    price_min = django_filters.NumberFilter(field_name='hpp', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='hpp', lookup_expr='lte')
    
    class Meta:
        model = Stock
        fields = [
            'is_active', 
            'is_online', 
            'category', 
            'supplier', 
            'warehouse', 
            'rack', 
            'unit',
            'is_low_stock',
            'price_min',
            'price_max'
        ]
        
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
        
    def filter_low_stock(self, queryset, name, value):
        """Filter for items where quantity is below min_stock"""
        if value:
            return queryset.filter(
                Q(min_stock__isnull=False) & 
                Q(quantity__lt=F('min_stock'))
            )
        return queryset
    
    def get_summary(self, queryset, exclude_field=None, exclude_values=None):
        """
        Calculate summary statistics for the filtered queryset, optionally excluding
        certain values based on exclude_field and exclude_values.
        """
        if exclude_field and exclude_values:
            exclusion_filter = {f'{exclude_field}__in': exclude_values}
            queryset = queryset.exclude(**exclusion_filter)
        
        # Calculate total value (quantity * hpp)
        value_expression = ExpressionWrapper(
            F('quantity') * F('hpp'),
            output_field=DecimalField(max_digits=20, decimal_places=2)
        )
        
        # Annotate each row with its value
        queryset_with_value = queryset.annotate(
            stock_value=value_expression
        )
        
        # Calculate summary statistics
        total_items = queryset.count()
        total_types = queryset.values('code').distinct().count()
        quantity_sum = queryset.aggregate(Sum('quantity'))['quantity__sum'] or 0
        
        total_value = queryset_with_value.aggregate(
            Sum('stock_value')
        )['stock_value__sum'] or 0
        
        low_stock_count = queryset.filter(
            Q(min_stock__isnull=False) & 
            Q(quantity__lt=F('min_stock'))
        ).count()
        
        # Calculate average price if there are items
        average_price = 0
        if quantity_sum > 0:
            average_price = total_value / quantity_sum
        
        summary = {
            'total_items': total_items,
            'total_types': total_types,
            'total_quantity': quantity_sum,
            'total_value': total_value,
            'average_price': average_price,
            'low_stock_count': low_stock_count,
        }
        
        return summary

    
    def get_breakdown(self, queryset, breakdown_field, exclude_values=None):
        value_expression = ExpressionWrapper(
            F('quantity') * F('hpp'),
            output_field=DecimalField(max_digits=20, decimal_places=2)
        )
        
        # Field mappings for the breakdown fields
        field_mappings = {
            'category': {
                'field': 'category__name',
                'id_field': 'category__id',
                'default': 'Uncategorized'
            },
            'warehouse': {
                'field': 'warehouse__name',
                'id_field': 'warehouse__id',
                'default': 'No Warehouse'  
            },
            'supplier': {
                'field': 'supplier__name',
                'id_field': 'supplier__id',
                'default': 'No Supplier'
            },
            'unit': {
                'field': 'unit__name',
                'id_field': 'unit__id',
                'default': 'No Unit'
            }
        }
        
        if breakdown_field not in field_mappings:
            return {}
            
        mapping = field_mappings[breakdown_field]
        field = mapping['field']
        id_field = mapping['id_field']
        default_name = mapping['default']
        
        # Build the queryset for breakdown
        breakdown_queryset = queryset

        if exclude_values:
            # Create a Q object to exclude the specified values
            exclusion_filter = {f'{id_field}__in': exclude_values}
            breakdown_queryset = breakdown_queryset.exclude(**exclusion_filter)

        
        # Calculate breakdown
        breakdown_data = breakdown_queryset.values(
            field, id_field  # Include the ID field for reference
        ).annotate(
            item_count = Count('id', distinct=True),
            total_quantity=Sum('quantity'),
            total_value=Sum(value_expression),
            low_stock_count=Count(Case(
                When(
                    Q(min_stock__isnull=False) & Q(quantity__lt=F('min_stock')),
                    then=Value(1)
                ),
                output_field=IntegerField()
            ))
        ).order_by('-total_value')

        result = []
        for item in breakdown_data:
            name = item[field] or default_name
            result.append({
                'id': item[id_field],
                'name': name,
                'count': item['item_count'],
                'quantity': item['total_quantity'],
                'value': item['total_value'],
                'low_stock_count': item['low_stock_count']
            })

        return result