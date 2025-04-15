from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from decimal import Decimal, InvalidOperation

from ..models import Stock
from ..serializers import StockSerializer, StockDetailSerializer
from ..filters.stock_filters import StockFilter

@extend_schema_view(
    list=extend_schema(
        summary="List stocks",
        description="Get a list of all stocks with pagination, filtering, and search capabilities.",
        responses={200: StockSerializer(many=True)},
        tags=["Stock"]
    ),
    retrieve=extend_schema(
        summary="Retrieve stock",
        description="Get detailed information about a specific stock item.",
        responses={200: StockDetailSerializer},
        tags=["Stock"]
    ),
    create=extend_schema(
        summary="Create stock",
        description="Create a new stock item.",
        responses={201: StockSerializer},
        tags=["Stock"]
    ),
    update=extend_schema(
        summary="Update stock",
        description="Update all fields of an existing stock item.",
        responses={200: StockSerializer},
        tags=["Stock"]
    ),
    partial_update=extend_schema(
        summary="Partial update stock",
        description="Update one or more fields of an existing stock item.",
        responses={200: StockSerializer},
        tags=["Stock"]
    ),
    destroy=extend_schema(
        summary="Delete stock",
        description="Delete an existing stock item.",
        responses={204: None},
        tags=["Stock"]
    )
)
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
    
    @extend_schema(
        summary="Get low stock items",
        description="Return all stock items that are below their minimum stock level.",
        responses={200: OpenApiExample(
            'Low stock items',
            value={"success": True, "stock": [{"id": 1, "name": "Example Item", "quantity": 5, "min_stock": 10}]},
            response_only=True
        )},
        tags=["Stock"]
    )
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

    @extend_schema(
        summary="Update stock margin",
        description="Update the margin based on the provided sell price.",
        request={
            "application/json": {
                "example": {
                    "sell_price": "15000"
                }
            }
        },
        responses={200: OpenApiExample(
            'Margin updated',
            value={"success": True, "margin": "15.00"},
            response_only=True
        )},
        tags=["Stock"]
    )
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
    
    @extend_schema(
        summary="Update stock quantity",
        description="Update stock quantity with automatic conversion if needed.",
        request={
            "application/json": {
                "example": {
                    "quantity_change": "10.5"
                }
            }
        },
        responses={
            200: OpenApiExample(
                'Quantity updated',
                value={"success": True, "new_quantity": "25.5"},
                response_only=True
            ),
            400: OpenApiExample(
                'Invalid request',
                value={"error": "Not enough stock available for this operation"},
                response_only=True
            )
        },
        tags=["Stock"]
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
    
    @extend_schema(
        summary="Get related stocks",
        description="Get all stocks related to this one (parent, siblings, children).",
        responses={200: OpenApiExample(
            'Related stocks',
            value={"success": True, "stock": [{"id": 2, "name": "Related Item 1"}, {"id": 3, "name": "Related Item 2"}]},
            response_only=True
        )},
        tags=["Stock"]
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
    
    @extend_schema(
        summary="Convert stock quantities",
        description="Convert stock quantity between related stocks.",
        request={
            "application/json": {
                "example": {
                    "target_stock_id": 2,
                    "quantity": "5.0"
                }
            }
        },
        responses={
            200: OpenApiExample(
                'Conversion successful',
                value={
                    "success": True,
                    "source_stock": {
                        "id": 1,
                        "name": "Source Item",
                        "quantity": "15.0"
                    },
                    "target_stock": {
                        "id": 2,
                        "name": "Target Item",
                        "quantity": "10.0"
                    },
                    "converted_quantity": "2.5"
                },
                response_only=True
            ),
            400: OpenApiExample(
                'Invalid request',
                value={"error": "Not enough source stock available"},
                response_only=True
            )
        },
        tags=["Stock"]
    )
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
        
        try:
            target_stock = Stock.objects.get(id=target_stock_id)
            quantity = Decimal(str(quantity))
            
            if target_stock not in source_stock.get_related_stocks():
                return Response(
                    {'error': 'Target stock is not related to source stock'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
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
    
    @extend_schema(
        summary="Preview stock conversion",
        description="Preview a manual conversion between related stocks without making changes.",
        request={
            "application/json": {
                "example": {
                    "target_stock_id": 2,
                    "quantity": "5.0"
                }
            }
        },
        responses={
            200: OpenApiExample(
                'Conversion preview',
                value={
                    "converted_quantity": "2.5",
                    "source_unit": "kg",
                    "target_unit": "box"
                },
                response_only=True
            ),
            400: OpenApiExample(
                'Invalid request',
                value={"error": "Target stock is not related to source stock"},
                response_only=True
            )
        },
        tags=["Stock"]
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