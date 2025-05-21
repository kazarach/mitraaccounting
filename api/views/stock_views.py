from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from decimal import Decimal, InvalidOperation
from django.db import transaction, models
from django.db.models import Sum, OuterRef, Subquery, Max, F, Min, Count
from django.db.models.functions import Coalesce
from django.utils import timezone

from ..models import Stock, TransItemDetail, TransactionType, TransactionHistory
from ..models import StockPrice, PriceCategory, StockPriceHistory
from ..serializers import StockSerializer, StockDetailSerializer, StockPriceSerializer
from ..filters.stock_filters import StockFilter

@extend_schema_view(
    list=extend_schema(
        summary="List stocks",
        description="Get a list of all stocks with pagination, filtering, and search capabilities. Add include_sales=true to include sales data for each stock.",
        parameters=[
            OpenApiParameter(
                name='include_sales',
                description='Include sales quantity data for each stock item',
                required=False,
                type=bool,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='include_orders',
                description='Include ordered quantity data for each stock item',
                required=False,
                type=bool,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='include_summary',
                description='Include summary for all',
                required=False,
                type=bool,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='breakdown',
                description='Field to breakdown statistics by (e.g. category, supplier)',
                required=False,
                type=str
            ),
            OpenApiParameter(
                name='category',
                description='Filter by category ID',
                required=False,
                type=int
            ),
            OpenApiParameter(
                name='supplier',
                description='Filter by supplier ID',
                required=False,
                type=int
            ),
            OpenApiParameter(
                name='transaction_type',
                description='PURCHASE, SALE',
                required=False,
                type=str,
                enum=['PURCHASE', 'SALE'],
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='range',
                description='Date range for sales data: today, week, month',
                required=False,
                type=str,
                enum=['today', 'week', 'month'],
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='start_date',
                description='Start date for sales data (format: YYYY-MM-DD)',
                required=False,
                type=str,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='end_date',
                description='End date for sales data (format: YYYY-MM-DD)',
                required=False,
                type=str,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='th_status',
                description='Transaction status filter for sales data',
                required=False,
                type=str,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='cashier',
                description='Cashier ID filter for sales data',
                required=False,
                type=int,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='stock_ids',
                description='Comma-separated list of stock IDs to filter by (e.g., 1,2,3,4,5)',
                required=False,
                type=str,
                location=OpenApiParameter.QUERY
            ),
        ],
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
    
    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by stock IDs if provided
        stock_ids = self.request.query_params.get('stock_ids')
        if stock_ids:
            stock_ids_list = stock_ids.split(',')
            queryset = queryset.filter(id__in=stock_ids_list)
        
        return queryset
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
        
    def list(self, request, *args, **kwargs):
        """Override list method to include sales data and order quantities when requested"""
        # Get filtered queryset using existing filters
        queryset = self.filter_queryset(self.get_queryset())
        
        # Check if we need to include sales data and order quantities
        include_sales = request.query_params.get('include_sales', '').lower() == 'true'
        include_orders = request.query_params.get('include_orders', '').lower() == 'true'
        transaction_type = request.query_params.get('transaction_type', 'PURCHASE').upper()
        include_summary = request.query_params.get('include_summary', '').lower() == 'true'

        summary_data = None
        if include_summary:
            # Use the filter's get_summary method
            stock_filter = self.filterset_class(request.query_params, queryset=queryset)
            summary_data = stock_filter.get_summary(queryset)
            
            # Check if breakdown is requested
            breakdown = request.query_params.get('breakdown')
            if breakdown:
                breakdown_data = stock_filter.get_breakdown(queryset, breakdown)
                summary_data[f'by_{breakdown}'] = breakdown_data

        # Get paginated results if pagination is enabled
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = serializer.data
            
            # Add sales data if requested
            if include_sales:
                self._enhance_with_sales_data(data, request)
            
            # Add order quantities if requested
            if include_orders:
                self._enhance_with_order_quantities(data, transaction_type)
        
            if include_summary:
                response.data['summary'] = summary_data
                
            return self.get_paginated_response(data)
        
        # Handle non-paginated results
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        # Add sales data if requested
        if include_sales:
            self._enhance_with_sales_data(data, request)
        
        # Add order quantities if requested
        if include_orders:
            self._enhance_with_order_quantities(data, transaction_type)
        
        if include_summary:
            response_data = {
                'summary': summary_data,
                'results': data
            }
            return Response(response_data)
        else:
            # Regular non-paginated response
            return Response(data)
        
    @extend_schema(
        summary="Get stock summary statistics",
        description="Retrieve summary statistics for stocks with optional breakdown by category",
        parameters=[
            OpenApiParameter(
                name='breakdown',
                description='Field to breakdown statistics by (e.g. category, supplier)',
                required=False,
                type=str
            ),
            OpenApiParameter(
                name='exclude_breakdown',
                description='Comma-separated list of values to exclude from breakdown (e.g. "4,5,6" for categories)',
                required=False,
                type=str
            ),
            # Include other common filter parameters that might be used
            OpenApiParameter(
                name='category',
                description='Filter by category ID',
                required=False,
                type=str
            ),
            OpenApiParameter(
                name='supplier',
                description='Filter by supplier ID',
                required=False,
                type=str
            )
        ],
        responses={
            200: OpenApiExample(
                'Success',
                value={
                    "total_count": 156,
                    "total_value": "45869.25",
                    "average_price": "294.03",
                    "low_stock_count": 23,
                    "by_category": {
                        "Electronics": {
                            "count": 47,
                            "value": "28450.75"
                        },
                        "Furniture": {
                            "count": 32,
                            "value": "12580.50"
                        }
                    }
                },
                response_only=True
            )
        },
        tags=["Summary", "Stock"]
    )
    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.filter_queryset(self.get_queryset())

        # Helper function to parse multiple values
        def parse_multi_values(param_name):
            raw = request.query_params.get(param_name)
            if not raw:
                return None
            try:
                return [int(x.strip()) for x in raw.split(',')]
            except ValueError:
                return [x.strip() for x in raw.split(',')]

        # Parse filter parameters that support multiple values
        category_filter = parse_multi_values('category')
        supplier_filter = parse_multi_values('supplier')

        # Parse exclude parameters (can be separate params or reuse exclude_breakdown)
        exclude_breakdown = parse_multi_values('exclude_breakdown') or []

        breakdown = request.query_params.get('breakdown')

        field_mappings = {
            'category': 'category__id',
            'warehouse': 'warehouse__id',
            'supplier': 'supplier__id',
            'unit': 'unit__id'
        }

        exclude_field = field_mappings.get(breakdown) if breakdown else None

        # Apply include filters for category and supplier if provided
        if category_filter:
            queryset = queryset.filter(category__id__in=category_filter)
        if supplier_filter:
            queryset = queryset.filter(supplier__id__in=supplier_filter)

        # Instantiate your filterset with the filtered queryset
        stock_filter = self.filterset_class(request.query_params, queryset=queryset)

        # Pass exclude_field and exclude_values to get_summary
        summary_data = stock_filter.get_summary(
            stock_filter.qs,  # filtered queryset from filterset_class
            exclude_field=exclude_field,
            exclude_values=exclude_breakdown if exclude_field else None
        )

        # Breakdown with exclusions
        if breakdown:
            breakdown_data = stock_filter.get_breakdown(
                stock_filter.qs,
                breakdown,
                exclude_values=exclude_breakdown
            )
            summary_data[f'by_{breakdown}'] = breakdown_data

        return Response(summary_data)

    
    @extend_schema(
        summary="Bulk update stock prices and margins",
        description="Update stock sell prices and margins in bulk. Each item must include `stock_id`, `price_category_id`, and `sell_price`. Margin is optional and calculated automatically.",
        request={
            "application/json": {
                "example": {
                    "items": [
                        {
                            "stock_id": 1,
                            "price_category_id": 2,
                            "sell_price": "150.00"
                        },
                        {
                            "stock_id": 2,
                            "price_category_id": 2,
                            "sell_price": "200.00"
                        }
                    ]
                }
            }
        },
        responses={
            200: OpenApiExample(
                'Success',
                value={
                    "updated": [
                        {
                            "id": 1,
                            "code": "STK001",
                            "name": "Product A",
                            "price_category": "Retail",
                            "old_price": 120.0,
                            "new_price": 150.0,
                            "margin": "25.00",
                            "warning": None
                        }
                    ],
                    "errors": []
                },
                response_only=True
            )
        },
        tags=["Stock"]
    )
    @action(detail=False, methods=['post'])
    def update_prices(self, request):
        """
        Bulk update stock sell prices and margins.
        Uses serializer validation to ensure data integrity.
        """
        from rest_framework import serializers

        items = request.data.get('items', [])
        updated_stocks = []
        errors = []

        with transaction.atomic():
            for item in items:
                stock_id = item.get('stock_id')
                price_category_id = item.get('price_category_id')
                new_sell_price = item.get('sell_price')

                if not stock_id or not price_category_id or new_sell_price is None:
                    errors.append("Stock ID, price category ID, and sell price are required")
                    continue

                try:
                    # Get the stock and price category
                    stock = Stock.objects.get(id=stock_id)
                    price_category = PriceCategory.objects.get(id=price_category_id)
                    
                    # Get or create the StockPrice
                    try:
                        stock_price = StockPrice.objects.get(
                            stock=stock, 
                            price_category=price_category
                        )
                        old_sell_price = stock_price.price_sell
                    except StockPrice.DoesNotExist:
                        stock_price = StockPrice(
                            stock=stock,
                            price_category=price_category,
                            start_date=timezone.now().date()
                        )
                        old_sell_price = Decimal('0.00')
                    
                    # Prepare data for validation
                    price_data = {
                        'price_sell': Decimal(str(new_sell_price)),
                        'price_category': price_category.id,
                        'margin': stock_price.margin,
                        'margin_type': stock_price.margin_type,
                        'allow_below_cost': stock_price.allow_below_cost,
                        'start_date': stock_price.start_date,
                        'end_date': stock_price.end_date,
                    }
                    
                    # Use serializer for validation
                    price_serializer = StockPriceSerializer(stock_price, data=price_data, partial=True)
                    price_serializer.is_valid(raise_exception=True)
                    
                    # Update the stock price using the validated data
                    updated_price = price_serializer.save()
                    
                    # Log the price change
                    StockPriceHistory.objects.create(
                        stock=stock,
                        price_category=price_category,
                        old_price=old_sell_price,
                        new_price=updated_price.price_sell,
                        changed_by=request.user,
                        change_reason="Price update (validated through serializer)"
                    )
                    
                    updated_stocks.append({
                        'id': stock.id,
                        'code': stock.code,
                        'name': stock.name,
                        'price_category': price_category.name,
                        'old_price': float(old_sell_price),
                        'new_price': float(updated_price.price_sell),
                        'margin': float(updated_price.margin or 0),
                    })

                except Stock.DoesNotExist:
                    errors.append(f"Stock with ID {stock_id} not found")
                except PriceCategory.DoesNotExist:
                    errors.append(f"Price category with ID {price_category_id} not found")
                except serializers.ValidationError as e:
                    errors.append(f"Validation error for stock {stock_id}: {str(e)}")
                except Exception as e:
                    errors.append(f"Error updating stock {stock_id}: {str(e)}")
        
        return Response({
            'updated': updated_stocks,
            'errors': errors
        })
    from drf_spectacular.utils import extend_schema, OpenApiExample

    @extend_schema(
        summary="Check stock price changes before transaction",
        description=(
            "Checks if the provided buy (HPP) prices differ from the last transaction for each stock. "
            "Also returns current sell prices and margins for each price category of the stock. "
            "This can be used to show a confirmation modal before finalizing the transaction or updating prices."
        ),
        request={
            "application/json": {
                "example": {
                    "items": [
                        {
                            "stock_id": 1,
                            "buy_price": "12500.00"
                        },
                        {
                            "stock_id": 2,
                            "buy_price": "10000.00"
                        }
                    ]
                }
            }
        },
        responses={
            200: OpenApiExample(
                'Price Check Result',
                value={
                    "price_differences": [
                        {
                            "stock_id": 1,
                            "stock_code": "SKU001",
                            "stock_name": "Cable HDMI",
                            "last_buy_price": 12000.0,
                            "current_buy_price": 12500.0,
                            "sell_prices": [
                                {
                                    "price_category": "Retail",
                                    "sell_price": 15000.0,
                                    "margin": 2000.0
                                },
                                {
                                    "price_category": "Distributor",
                                    "sell_price": 14500.0,
                                    "margin": 1500.0
                                }
                            ]
                        }
                    ],
                    "errors": []
                },
                response_only=True
            )
        },
        tags=["Stock"]
    )

    @action(detail=False, methods=['post'])
    def check_price(self, request):
        """
        Check HPP (buy price) changes and return all sell prices per stock & category.
        """
        items = request.data.get('items', [])
        differences = []
        errors = []

        stock_ids = [item.get('stock_id') for item in items if item.get('stock_id')]
        stock_ids = list(set(stock_ids))  # remove duplicates

        # Fetch all StockPrice entries for given stocks
        stock_prices = StockPrice.objects.filter(
            stock_id__in=stock_ids
        ).select_related('stock', 'price_category')

        # Group by stock_id
        from collections import defaultdict
        price_data_by_stock = defaultdict(list)

        for sp in stock_prices:
            price_data_by_stock[sp.stock_id].append({
                'price_category': sp.price_category.name,
                'sell_price': float(sp.price_sell),
                'margin': float(sp.margin or 0),
            })

        for item in items:
            stock_id = item.get('stock_id')
            current_hpp = Decimal(str(item.get('buy_price', 0)))

            if not stock_id:
                errors.append("Missing stock_id in item.")
                continue

            try:
                stock = Stock.objects.get(id=stock_id)

                # Get last HPP from previous transaction
                last_txn_item = (
                    TransactionHistory.objects
                    .filter(stock_id=stock_id)
                    .order_by('-transaction__date')
                    .first()
                )
                last_hpp = last_txn_item.hpp if last_txn_item else Decimal('0.00')

                # Only return if HPP changed
                if current_hpp != last_hpp:
                    differences.append({
                        'stock_id': stock.id,
                        'stock_code': stock.code,
                        'stock_name': stock.name,
                        'last_buy_price': float(last_hpp),
                        'current_buy_price': float(current_hpp),
                        'sell_prices': price_data_by_stock.get(stock_id, [])
                    })

            except Stock.DoesNotExist:
                errors.append(f"Stock with ID {stock_id} not found.")
            except Exception as e:
                errors.append(f"Error checking stock {stock_id}: {str(e)}")

        return Response({
            'price_differences': differences,
            'errors': errors
        })

    @extend_schema(
        summary="Get stock by IDs",
        description="Retrieves detailed stock information for the provided item IDs.",
        request={
            "application/json": {
                "example": {
                    "item_ids": [5, 3, 9, 7, 1, 6]
                }
            }
        },
        responses={
            200: StockSerializer(many=True),
            400: OpenApiExample(
                'Invalid request',
                value={"error": "item_ids must be a list of integers"},
                response_only=True
            )
        },
        tags=["Stock"]
    )
    @action(detail=False, methods=['post'])
    def by_ids(self, request):
        item_ids = request.data.get('item_ids', [])

        if not isinstance(item_ids, list) or not all(isinstance(i, int) for i in item_ids):
            return Response(
                {"error": "item_ids must be a list of integers"},
                status=status.HTTP_400_BAD_REQUEST
            )

        stocks = Stock.objects.filter(id__in=item_ids).select_related(
            'supplier', 'warehouse', 'category', 'rack', 'unit', 'parent_stock'
        ).prefetch_related('sales_prices', 'assemblies', 'child_stocks')

        # Index by ID for fast lookup
        stock_map = {stock.id: stock for stock in stocks}

        # Sort according to the original item_ids order
        ordered_stocks = [stock_map[i] for i in item_ids if i in stock_map]

        serializer = self.get_serializer(ordered_stocks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def _enhance_with_order_quantities(self, stock_data, transaction_type):
        """Add detailed orders data to stock items based on TransItemDetail records"""
        stock_ids = [item['id'] for item in stock_data]
        
        # Get all purchase or sale orders based on the transaction_type
        transaction_filter = {
            'th_type': transaction_type
        }
        
        transaction_history = TransactionHistory.objects.filter(
            **transaction_filter,
            th_order=True
        )
        
        # Get order quantities by stock_id
        ordered_quantities = TransItemDetail.objects.filter(
            transaction__in=transaction_history,
            stock_id__in=stock_ids
        ).values('stock_id').annotate(
            total_quantity=Sum('quantity'),
            oldest_order_date=Min('transaction__th_date'),
            newest_order_date=Max('transaction__th_date'),
            order_count=Count('transaction', distinct=True)
        )
        
        # Convert to dictionary for easy lookup
        ordered_data = {item['stock_id']: {
            'quantity': item['total_quantity'],
            'oldest_order_date': item['oldest_order_date'],
            'newest_order_date': item['newest_order_date'],
            'order_count': item['order_count']
        } for item in ordered_quantities}
        
        # Add the ordered data to each stock
        for stock in stock_data:
            stock_id = stock['id']
            if stock_id in ordered_data:
                stock['ordered_quantity'] = ordered_data[stock_id]['quantity']
                stock['oldest_order_date'] = ordered_data[stock_id]['oldest_order_date']
                stock['newest_order_date'] = ordered_data[stock_id]['newest_order_date']
                stock['order_count'] = ordered_data[stock_id]['order_count']
                stock['has_pending_orders'] = True
            else:
                stock['ordered_quantity'] = 0
                stock['oldest_order_date'] = None
                stock['newest_order_date'] = None
                stock['order_count'] = 0
                stock['has_pending_orders'] = False

    def _enhance_with_sales_data(self, stock_data, request):
        """Add sales and return data to stock items based on TransItemDetail records"""
        stock_ids = [item['id'] for item in stock_data]

        from django.utils import timezone
        import pytz
        from datetime import timedelta, datetime

        jakarta_tz = pytz.timezone('Asia/Jakarta')
        now_jakarta = timezone.now().astimezone(jakarta_tz)
        today = now_jakarta.date()

        date_ranges = {
            'today': {'start_date': today, 'end_date': today},
            'week': {'start_date': today - timedelta(days=6), 'end_date': today},
            'month': {'start_date': today - timedelta(days=29), 'end_date': today},
        }

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if start_date_str and end_date_str:
            try:
                custom_start = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                custom_end = datetime.strptime(end_date_str, "%Y-%m-%d").date()
                date_ranges['custom'] = {
                    'start_date': custom_start,
                    'end_date': custom_end
                }
            except ValueError:
                pass

        additional_filters = {}
        th_status = request.query_params.get('th_status')
        if th_status:
            additional_filters['th_status'] = th_status

        cashier_id = request.query_params.get('cashier')
        if cashier_id and cashier_id.isdigit():
            additional_filters['cashier_id'] = int(cashier_id)

        for range_name, range_dates in date_ranges.items():
            base_filter = {
                'th_date__range': (range_dates['start_date'], range_dates['end_date']),
                **additional_filters
            }

            def get_quantity(th_type):
                filter_with_type = {**base_filter, 'th_type': th_type}
                trans = TransactionHistory.objects.filter(**filter_with_type)
                data = TransItemDetail.objects.filter(
                    transaction__in=trans,
                    stock_id__in=stock_ids
                ).values('stock_id').annotate(total_quantity=Sum('quantity'))
                return {item['stock_id']: item['total_quantity'] for item in data}

            sales_by_stock = get_quantity(TransactionType.SALE)
            return_sales_by_stock = get_quantity(TransactionType.RETURN_SALE)
            purchase_by_stock = get_quantity(TransactionType.PURCHASE)
            return_purchase_by_stock = get_quantity(TransactionType.RETURN_PURCHASE)

            for stock in stock_data:
                sold = sales_by_stock.get(stock['id'], 0)
                returned = return_sales_by_stock.get(stock['id'], 0)
                purchased = purchase_by_stock.get(stock['id'], 0)
                returned_purchase = return_purchase_by_stock.get(stock['id'], 0)
                net_sales = sold - returned
                net_purchases = purchased - returned_purchase

                # Store all values
                stock[f'sales_quantity_{range_name}'] = net_sales
                stock[f'purchase_quantity_{range_name}'] = net_purchases

                # Requested range (set directly)
                requested_range = request.query_params.get('range', 'today')
                if range_name == requested_range or (not requested_range and range_name == 'today'):
                    stock['sales_quantity'] = net_sales
                    stock['purchase_quantity'] = net_purchases
                    stock['is_fast_moving'] = net_sales > 0