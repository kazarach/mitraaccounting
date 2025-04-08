from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from ..filters import TransactionHistoryFilter
from ..models import TransactionHistory, TransItemDetail
from ..serializers import TransactionHistorySerializer, TransItemDetailSerializer



class TransactionHistoryViewSet(viewsets.ModelViewSet):
    queryset = TransactionHistory.objects.prefetch_related('items').select_related(
        'supplier', 'customer', 'cashier', 'bank', 'event_discount', 'th_so', 'th_retur'
    )
    serializer_class = TransactionHistorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransactionHistoryFilter

    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        transaction = self.get_object()
        items = transaction.items.all()
        serializer = TransItemDetailSerializer(items, many=True)
        return Response(serializer.data)

class TransItemDetailViewSet(viewsets.ModelViewSet):
    queryset = TransItemDetail.objects.select_related('transaction', 'stock')
    serializer_class = TransItemDetailSerializer
