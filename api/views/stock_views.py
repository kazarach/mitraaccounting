from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from decimal import Decimal, InvalidOperation

from ..models import Stock
from ..serializers import StockSerializer, StockDetailSerializer
from ..filters.stock_filters import StockFilter

class StockViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing stock items.
    Requires authentication for all operations.
    """
    queryset = Stock.objects.select_related(
        'supplier', 'warehouse', 'category', 'rack', 'unit'
    )
    serializer_class = StockSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StockFilter
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
        Requires authentication.
        """
        low_stock_items = [item for item in self.get_queryset() if item.is_low_stock()]
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response({
                'success': True,
                'stock': serializer.data
            })
    
    @action(detail=True, methods=['post'])
    def update_margin(self, request, pk=None):
        """
        Update the margin based on a provided sell price.
        Requires authentication.
        """
        stock = self.get_object()
        sell_price = request.data.get('sell_price')
        
        if not sell_price:
            return Response(
                {'error': 'Sell price is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            sell_price = Decimal(str(sell_price))

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
    
    @action(detail=True, methods=['post'])
    def update_quantity(self, request, pk=None):
        """
        Update stock quantity with automatic conversion if needed.
        Requires authentication.
        """
        stock = self.get_object()
        quantity_change = request.data.get('quantity_change')
        
        if quantity_change is None:
            return Response(
                {'error': 'Quantity change is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantity_change = Decimal(str(quantity_change))
            result = stock.update_quantity(quantity_change)
            
            if result:
                return Response({'success': True, 'new_quantity': stock.quantity})
            else:
                return Response(
                    {'error': 'Not enough stock available for this operation'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid quantity change'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def related_stocks(self, request, pk=None):
        """
        Get all stocks related to this one (parent, siblings, children).
        Requires authentication.
        """
        stock = self.get_object()
        related = stock.get_related_stocks()
        serializer = self.get_serializer(related, many=True)
        return Response({
                'success': True,
                'stock': serializer.data
            })
    
    @action(detail=True, methods=['post'])
    def convert_stock(self, request, pk=None):
        """
        Convert stock quantity between related stocks.
        Requires authentication.
        """
        source_stock = self.get_object()
        target_stock_id = request.data.get('target_stock_id')
        quantity = request.data.get('quantity')
        
        if not target_stock_id or quantity is None:
            return Response(
                {'error': 'Target stock ID and quantity are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if target_stock not in source_stock.get_related_stocks():
            return Response(
                {'error': 'Target stock is not related to source stock'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target_stock = Stock.objects.get(id=target_stock_id)
            quantity = Decimal(str(quantity))

            
            # Check if we have enough stock
            if source_stock.quantity < quantity:
                return Response(
                    {'error': 'Not enough source stock available'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Convert quantity to target stock's unit
            converted_quantity = target_stock.convert_from(source_stock, quantity)
            
            # Update both stocks
            source_stock.quantity -= quantity
            source_stock.save(update_fields=['quantity'])
            
            target_stock.quantity += converted_quantity
            target_stock.save(update_fields=['quantity'])
            
            return Response({
                'success': True,
                'source_stock': {
                    'id': source_stock.id,
                    'name': source_stock.name,
                    'quantity': source_stock.quantity
                },
                'target_stock': {
                    'id': target_stock.id,
                    'name': target_stock.name,
                    'quantity': target_stock.quantity
                },
                'converted_quantity': converted_quantity
            })
        except Stock.DoesNotExist:
            return Response(
                {'error': 'Target stock not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid quantity'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def conversion_preview(self, request, pk=None):
        """
        Preview a manual conversion between related stocks.
        """
        source_stock = self.get_object()
        target_stock_id = request.data.get('target_stock_id')
        quantity = request.data.get('quantity')
        
        if not target_stock_id or quantity is None:
            return Response(
                {'error': 'Target stock ID and quantity are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target_stock = Stock.objects.get(id=target_stock_id)
            quantity = Decimal(str(quantity))

            if target_stock not in source_stock.get_related_stocks():
                return Response(
                    {'error': 'Target stock is not related to source stock'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            converted_quantity = target_stock.convert_from(source_stock, quantity)

            return Response({
                'converted_quantity': converted_quantity,
                'source_unit': source_stock.unit.name if source_stock.unit else None,
                'target_unit': target_stock.unit.name if target_stock.unit else None,
            })
        except Stock.DoesNotExist:
            return Response({'error': 'Target stock not found'}, status=404)
        except (InvalidOperation, ValueError, TypeError):
            return Response({'error': 'Invalid quantity'}, status=400)
