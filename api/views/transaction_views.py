from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta, datetime 

from ..filters.transaction_history_filters import TransactionHistoryFilter, TransactionItemDetailFilter
from ..models import TransactionHistory, TransItemDetail
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
            'stock__name'
        ).annotate(
            total_quantity=Sum('quantity')
        ).order_by('-total_quantity')

        result = [
            {
                "stock_id": item['stock_id'],
                "stock_name": item['stock__name'],
                "total_quantity": item['total_quantity']
            }
            for item in items
        ]

        return Response(result)
