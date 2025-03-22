from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Stock
from ..serializers import StockSerializer, StockDetailSerializer

class StockViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing stock items.
    """
    queryset = Stock.objects.all().select_related(
        'supplier', 'warehouse', 'category', 'rack', 'default_unit'
    )
    serializer_class = StockSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_online', 'category', 'supplier', 'warehouse', 'rack']
    search_fields = ['code', 'barcode', 'name']
    ordering_fields = ['name', 'code', 'quantity', 'hpp', 'price_buy', 'updated_at']
    ordering = ['code']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StockDetailSerializer
        return StockSerializer
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Return all stock items that are below their minimum stock level.
        """
        low_stock_items = [item for item in self.get_queryset() if item.is_low_stock()]
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_margin(self, request, pk=None):
        """
        Update the margin based on a provided sell price.
        """
        stock = self.get_object()
        sell_price = request.data.get('sell_price')
        
        if not sell_price:
            return Response(
                {'error': 'Sell price is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sell_price = float(sell_price)
            result = stock.update_margin_from_sell_price(sell_price)
            
            if result:
                return Response({'success': True, 'margin': stock.margin})
            else:
                return Response(
                    {'error': 'Could not update margin. Please check that HPP is greater than zero.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid sell price'},
                status=status.HTTP_400_BAD_REQUEST
            )