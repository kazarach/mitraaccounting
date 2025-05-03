from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from django.utils import timezone
from django.db.models import Sum, Count, F, DecimalField, Max
from django.db.models.functions import Coalesce
from datetime import timedelta, datetime 
from decimal import Decimal

from ..filters.transaction_history_filters import TransactionHistoryFilter, TransactionItemDetailFilter
from ..models import TransactionHistory, TransItemDetail, TransactionType, Supplier
from ..serializers import TransactionHistorySerializer, TransItemDetailSerializer

import pytz

@extend_schema_view(
    list=extend_schema(
        summary="List transactions",
        description="Get a list of all transactions with pagination and filtering capabilities.",
        responses={200: TransactionHistorySerializer(many=True)},
        tags=["Transaction"]
    ),
    retrieve=extend_schema(
        summary="Retrieve transaction",
        description="Get detailed information about a specific transaction including metadata.",
        responses={200: TransactionHistorySerializer},
        tags=["Transaction"]
    ),
    create=extend_schema(
        summary="Create transaction",
        description="Create a new transaction with its associated items.",
        responses={201: TransactionHistorySerializer},
        tags=["Transaction"]
    ),
    update=extend_schema(
        summary="Update transaction",
        description="Update all fields of an existing transaction.",
        responses={200: TransactionHistorySerializer},
        tags=["Transaction"]
    ),
    partial_update=extend_schema(
        summary="Partial update transaction",
        description="Update one or more fields of an existing transaction.",
        responses={200: TransactionHistorySerializer},
        tags=["Transaction"]
    ),
    destroy=extend_schema(
        summary="Delete transaction",
        description="Delete an existing transaction and its associated items.",
        responses={204: None},
        tags=["Transaction"]
    )
)
class TransactionHistoryViewSet(viewsets.ModelViewSet):
    queryset = TransactionHistory.objects.prefetch_related('items').select_related(
        'supplier', 'customer', 'cashier', 'bank', 'event_discount', 'th_so', 'th_retur'
    )
    serializer_class = TransactionHistorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransactionHistoryFilter

    @extend_schema(
        summary="Get transaction items",
        description="Retrieve all line items associated with a specific transaction.",
        responses={
            200: OpenApiExample(
                'Transaction items',
                value=[
                    {
                        "id": 1,
                        "transaction": 1,
                        "stock": {
                            "id": 5,
                            "name": "Product Name",
                            "code": "PRD001"
                        },
                        "quantity": 5,
                        "price": "10000.00",
                        "discount": "0.00",
                        "subtotal": "50000.00"
                    }
                ],
                response_only=True
            )
        },
        tags=["Transaction"]
    )
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        transaction = self.get_object()
        items = transaction.items.all()
        serializer = TransItemDetailSerializer(items, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Transaction Reports",
        description="Generate reports of transactions filtered by type and date range",
        tags=["Reports"],
        parameters=[
            OpenApiParameter(
                name='transaction_type',
                description='Type of transaction to filter. Options: SALE, PURCHASE, RETURN_SALE, etc.',
                required=False,
                type=str,
                enum=['SALE', 'PURCHASE', 'RETURN_SALE', 'RETURN_PURCHASE', 'USAGE', 
                      'TRANSFER', 'PAYMENT', 'RECEIPT', 'ADJUSTMENT', 'EXPENSE'],
            ),
            OpenApiParameter(name='start_date', type=str, required=False, description='Format: YYYY-MM-DD'),
            OpenApiParameter(name='end_date', type=str, required=False, description='Format: YYYY-MM-DD'),
            OpenApiParameter(name='cashier', type=str, required=False, description='Filter by cashier ID'),
            OpenApiParameter(name='customer', type=str, required=False, description='Filter by customer ID'),
            OpenApiParameter(name='supplier', type=str, required=False, description='Filter by supplier ID'),
            OpenApiParameter(name='status', type=bool, required=False, description='Filter by transaction status'),
            OpenApiParameter(
                name='range',
                description='Predefined date range options',
                required=False,
                type=str,
                enum=['today', 'week', 'month', 'year', 'custom'],
                default='today'
            ),
        ]
    )
    @action(detail=False, methods=['get'])
    def report(self, request):
        # Parse date parameters
        jakarta_tz = pytz.timezone('Asia/Jakarta')
        now_jakarta = timezone.now().astimezone(jakarta_tz)
        today = now_jakarta.date()
        
        # Define standard date ranges
        date_ranges = {
            'today': {'start_date': today, 'end_date': today},
            'week': {'start_date': today - timedelta(days=6), 'end_date': today},
            'month': {'start_date': today - timedelta(days=29), 'end_date': today},
            'year': {'start_date': today - timedelta(days=364), 'end_date': today},
        }
        
        # Get requested range or default to today
        requested_range = request.query_params.get('range', 'today')
        
        # Get start and end dates
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # Handle custom date range if both start and end dates are provided
        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
                # Add this as a custom range
                date_ranges['custom'] = {
                    'start_date': start_date,
                    'end_date': end_date
                }
                # Set requested range to custom
                requested_range = 'custom'
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
        
        # Use the selected date range
        if requested_range in date_ranges:
            start_date = date_ranges[requested_range]['start_date']
            end_date = date_ranges[requested_range]['end_date']
        else:
            # Default to today if requested range is invalid
            start_date = date_ranges['today']['start_date']
            end_date = date_ranges['today']['end_date']
        
        # Convert to datetime for proper querying
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Rest of your existing code...
        queryset = self.queryset.filter(th_date__range=(start_datetime, end_datetime))
        
        transaction_type = request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(th_type=transaction_type)
            
        # Apply additional filters
        def _parse_multi_param(param):
            return [int(x) for x in param.split(',') if x.strip().isdigit()]
        
        if 'cashier' in request.query_params:
            cashier_ids = _parse_multi_param(request.query_params.get('cashier'))
            queryset = queryset.filter(cashier_id__in=cashier_ids)

        if 'customer' in request.query_params:
            customer_ids = _parse_multi_param(request.query_params.get('customer'))
            queryset = queryset.filter(customer_id__in=customer_ids)

        if 'supplier' in request.query_params:
            supplier_ids = _parse_multi_param(request.query_params.get('supplier'))
            all_supplier_ids = set()
            for supplier_id in supplier_ids:
                try:
                    supplier = Supplier.objects.get(id=supplier_id)
                    # Get this supplier and all its descendants
                    descendants = supplier.get_descendants(include_self=True)
                    all_supplier_ids.update(descendants.values_list('id', flat=True))
                except Supplier.DoesNotExist:
                    continue  # Skip if supplier doesn't exist

            if all_supplier_ids:
                queryset = queryset.filter(supplier_id__in=all_supplier_ids)

        if 'status' in request.query_params:
            status_param = request.query_params.get('status').lower()
            status_value = True if status_param in ('true', '1', 'yes') else False
            queryset = queryset.filter(th_status=status_value)

        serializer = self.get_serializer(queryset, many=True)
        result = serializer.data
        # Update summary to include the selected range name
        summary = {
            'total_transactions': queryset.count(),
            'total_amount': float(queryset.aggregate(
                total=Coalesce(Sum('th_total'), 0, output_field=DecimalField())
            )['total']),
            'date_range': {
                'range_type': requested_range,
                'start_date': start_date.strftime("%Y-%m-%d"),
                'end_date': end_date.strftime("%Y-%m-%d"),
            },
            'filters_applied': {
                'transaction_type': transaction_type if transaction_type else 'All',
            }
        }
        
        return Response({
            'summary': summary,
            'results': result
        })

@extend_schema_view(
    list=extend_schema(
        summary="List transaction items",
        description="Get a list of all transaction line items.",
        responses={200: TransItemDetailSerializer(many=True)},
        tags=["Transaction"]
    ),
    retrieve=extend_schema(
        summary="Retrieve transaction item",
        description="Get detailed information about a specific transaction line item.",
        responses={200: TransItemDetailSerializer},
        tags=["Transaction"]
    ),
    create=extend_schema(
        summary="Create transaction item",
        description="Create a new transaction line item.",
        responses={201: TransItemDetailSerializer},
        tags=["Transaction"]
    ),
    update=extend_schema(
        summary="Update transaction item",
        description="Update all fields of an existing transaction line item.",
        responses={200: TransItemDetailSerializer},
        tags=["Transaction"]
    ),
    partial_update=extend_schema(
        summary="Partial update transaction item",
        description="Update one or more fields of an existing transaction line item.",
        responses={200: TransItemDetailSerializer},
        tags=["Transaction"]
    ),
    destroy=extend_schema(
        summary="Delete transaction item",
        description="Delete an existing transaction line item.",
        responses={204: None},
        tags=["Transaction"]
    )
)

class TransItemDetailViewSet(viewsets.ModelViewSet):
    queryset = TransItemDetail.objects.select_related('transaction', 'stock')
    serializer_class = TransItemDetailSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransactionItemDetailFilter

    @extend_schema(
        summary="Fast moving items",
        description="List fast moving items sold today, this week, or this month. Supports filters.",
        tags=["Transaction"],
        parameters=[
            OpenApiParameter(
                name='range',
                description='Date range to filter by. Options: today, week, month.',
                required=False,
                type=str,
                enum=['today', 'week', 'month'],
            ),
                OpenApiParameter(name='cashier', type=int, required=False),
                OpenApiParameter(name='th_status', type=str, required=False),
                OpenApiParameter(name='start_date', type=str, required=False, description='Format: YYYY-MM-DD'),
                OpenApiParameter(name='end_date', type=str, required=False, description='Format: YYYY-MM-DD'),
        ]
    )
    @action(detail=False, methods=['get'])
    def fast_moving(self, request):
        jakarta_tz = pytz.timezone('Asia/Jakarta')
        now_jakarta = timezone.now().astimezone(jakarta_tz)
        today = now_jakarta.date()

        # 1. Check explicit dates first
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
        else:
            # 2. Fallback to range option
            range_type = request.query_params.get('range', 'today')
            if range_type == 'week':
                start_date = today - timedelta(days=today.weekday())
            elif range_type == 'month':
                start_date = today.replace(day=1)
            else:
                start_date = today
            end_date = today

        # Filter transactions based on date range
        base_qs = TransactionHistory.objects.filter(th_date__range=(start_date, end_date))
        filterset = TransactionHistoryFilter(request.GET, queryset=base_qs)
        filtered_transactions = filterset.qs

        items = TransItemDetail.objects.filter(
            transaction__in=filtered_transactions
        ).values(
            'stock_id',
            'stock__name',
            'stock__barcode',
            'stock__supplier__name'
        ).annotate(
            total_quantity=Sum('quantity')
        ).order_by('-total_quantity')

        result = [
            {
                "stock_id": item['stock_id'],
                "stock_name": item['stock__name'],
                "stock_barcode": item['stock__barcode'],
                "stock_supplier": item['stock__supplier__name'],
                "total_quantity": item['total_quantity'],
            }
            for item in items
        ]

        return Response(result)
