from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from django.utils import timezone
from django.db.models import Sum, Count, F, DecimalField, Max
from django.db.models.functions import Coalesce
from datetime import timedelta, datetime 

from ..filters.transaction_history_filters import TransactionHistoryFilter, TransactionItemDetailFilter
from ..models import TransactionHistory, TransItemDetail, TransactionType
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
            OpenApiParameter(name='cashier', type=int, required=False, description='Filter by cashier ID'),
            OpenApiParameter(name='customer', type=int, required=False, description='Filter by customer ID'),
            OpenApiParameter(name='supplier', type=int, required=False, description='Filter by supplier ID'),
            OpenApiParameter(name='status', type=bool, required=False, description='Filter by transaction status'),
            OpenApiParameter(
                name='group_by',
                description='Group results by field. Options: daily, weekly, monthly, cashier, customer, supplier',
                required=False,
                type=str,
                enum=['daily', 'weekly', 'monthly', 'cashier', 'customer', 'supplier'],
            ),
        ]
    )
    @action(detail=False, methods=['get'])
    def report(self, request):
        # Parse date parameters
        jakarta_tz = pytz.timezone('Asia/Jakarta')
        now_jakarta = timezone.now().astimezone(jakarta_tz)
        today = now_jakarta.date()
        
        # Get date range
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        try:
            if start_date_str:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            else:
                # Default to first day of current month if not specified
                start_date = today.replace(day=1)
                
            if end_date_str:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            else:
                # Default to today if not specified
                end_date = today
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
        
        # Convert to datetime for proper querying
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Base query filtering by date range
        queryset = self.queryset.filter(th_date__range=(start_datetime, end_datetime))
        
        # Apply transaction type filter if specified
        transaction_type = request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(th_type=transaction_type)
            
        # Apply additional filters
        if 'cashier' in request.query_params:
            queryset = queryset.filter(cashier_id=request.query_params.get('cashier'))
            
        if 'customer' in request.query_params:
            queryset = queryset.filter(customer_id=request.query_params.get('customer'))
            
        if 'supplier' in request.query_params:
            queryset = queryset.filter(supplier_id=request.query_params.get('supplier'))
            
        if 'status' in request.query_params:
            status_param = request.query_params.get('status').lower()
            status_value = True if status_param in ('true', '1', 'yes') else False
            queryset = queryset.filter(th_status=status_value)

        # Determine how to group the results
        group_by = request.query_params.get('group_by', None)
        
        if group_by == 'daily':
            # Group by day
            from django.db.models.functions import TruncDate
            result = self._group_by_date(queryset, TruncDate('th_date'), 'daily')
        elif group_by == 'weekly':
            # Group by week
            from django.db.models.functions import TruncWeek
            result = self._group_by_date(queryset, TruncWeek('th_date'), 'weekly')
        elif group_by == 'monthly':
            # Group by month
            from django.db.models.functions import TruncMonth
            result = self._group_by_date(queryset, TruncMonth('th_date'), 'monthly')
        elif group_by == 'cashier':
            # Group by cashier
            result = self._group_by_entity(queryset, 'cashier', 'cashier__username')
        elif group_by == 'customer':
            # Group by customer
            result = self._group_by_entity(queryset, 'customer', 'customer__name')
        elif group_by == 'supplier':
            # Group by supplier
            result = self._group_by_entity(queryset, 'supplier', 'supplier__name')
        else:
            # No grouping, return detailed list
            serializer = self.get_serializer(queryset, many=True)
            result = serializer.data
            
        # Add summary information
        summary = {
            'total_transactions': queryset.count(),
            'total_amount': float(queryset.aggregate(
                total=Coalesce(Sum('th_total'), 0, output_field=DecimalField())
            )['total']),
            'date_range': {
                'start_date': start_date.strftime("%Y-%m-%d"),
                'end_date': end_date.strftime("%Y-%m-%d"),
            },
            'filters_applied': {
                'transaction_type': transaction_type if transaction_type else 'All',
                'group_by': group_by if group_by else 'None',
            }
        }
        
        return Response({
            'summary': summary,
            'results': result
        })
    
    def _group_by_date(self, queryset, date_trunc_func, period_name):
        """Helper method to group transactions by date periods"""
        result = queryset.annotate(
            period=date_trunc_func
        ).values(
            'period'
        ).annotate(
            transaction_count=Count('id'),
            total_amount=Sum('th_total')
        ).order_by('period')
        
        # Format results to be more readable
        return [
            {
                'period': item['period'].strftime("%Y-%m-%d"),
                'period_type': period_name,
                'transaction_count': item['transaction_count'],
                'total_amount': float(item['total_amount'] if item['total_amount'] else 0)
            }
            for item in result
        ]
    
    def _group_by_entity(self, queryset, entity_field, name_field):
        """Helper method to group transactions by entity (cashier, customer, supplier)"""
        result = queryset.values(
            f'{entity_field}_id',
            name=F(name_field)
        ).annotate(
            transaction_count=Count('id'),
            total_amount=Sum('th_total')
        ).order_by(f'{entity_field}_id')
        
        # Format results to be more readable
        return [
            {
                'id': item[f'{entity_field}_id'],
                'name': item['name'],
                'transaction_count': item['transaction_count'],
                'total_amount': float(item['total_amount'] if item['total_amount'] else 0)
            }
            for item in result
        ]
    
    @extend_schema(
        summary="Transaction Type Summary",
        description="Get summary of transactions by type across date range",
        tags=["Reports"],
        parameters=[
            OpenApiParameter(name='start_date', type=str, required=False, description='Format: YYYY-MM-DD'),
            OpenApiParameter(name='end_date', type=str, required=False, description='Format: YYYY-MM-DD'),
        ]
    )
    @action(detail=False, methods=['get'])
    def type_summary(self, request):
        """Get summary of transactions grouped by transaction type"""
        # Parse date parameters
        jakarta_tz = pytz.timezone('Asia/Jakarta')
        now_jakarta = timezone.now().astimezone(jakarta_tz)
        today = now_jakarta.date()
        
        # Get date range
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        try:
            if start_date_str:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            else:
                # Default to first day of current month
                start_date = today.replace(day=1)
                
            if end_date_str:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            else:
                # Default to today
                end_date = today
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
        
        # Convert to datetime for proper querying
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Group by transaction type
        queryset = self.queryset.filter(th_date__range=(start_datetime, end_datetime))
        result = queryset.values(
            'th_type'
        ).annotate(
            transaction_count=Count('id'),
            total_amount=Sum('th_total')
        ).order_by('th_type')
        
        # Format results
        formatted_result = [
            {
                'transaction_type': item['th_type'],
                'transaction_count': item['transaction_count'],
                'total_amount': float(item['total_amount'] if item['total_amount'] else 0)
            }
            for item in result
        ]
        
        return Response({
            'date_range': {
                'start_date': start_date.strftime("%Y-%m-%d"),
                'end_date': end_date.strftime("%Y-%m-%d"),
            },
            'results': formatted_result
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
