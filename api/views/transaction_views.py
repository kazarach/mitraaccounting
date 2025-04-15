from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample

from ..filters.transaction_history_filters import TransactionHistoryFilter
from ..models import TransactionHistory, TransItemDetail
from ..serializers import TransactionHistorySerializer, TransItemDetailSerializer


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