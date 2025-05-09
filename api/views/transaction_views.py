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
from ..models import Stock, StockPriceHistory, StockPrice
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
    ),
        calculate_preview=extend_schema(
        summary="Calculate transaction preview",
        description="Calculates totals, discounts, and taxes for a transaction without saving it",
        request=TransactionHistorySerializer,
        responses={200: TransactionHistorySerializer},
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

    def create(self, request, *args, **kwargs):
        """
        Create a transaction with optional th due date.
        """
        # Process th_due_date separately if provided
        th_due_date = request.data.get('th_due_date')
        
        # Get serializer and validate
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Save instance
        instance = serializer.save()
        
        # Set th due date if provided
        if th_due_date:
            instance.th_due_date = th_due_date
            instance.save(update_fields=['th_due_date'])
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
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
    
    @action(detail=False, methods=['post'])
    def calculate_preview(self, request):
        """
        Calculate transaction totals without saving to database.
        Returns the processed transaction with all calculations applied.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Extract validated data
        transaction_data = serializer.validated_data
        items_data = transaction_data.pop('items', [])
        
        # Create a temporary transaction object (not saved)
        temp_transaction = TransactionHistory(**transaction_data)
        
        # Calculate totals for each item
        processed_items = []
        total_netto = Decimal('0.00')
        
        for item_data in items_data:
            # Create a temporary item object linked to the temporary transaction
            temp_item = TransItemDetail(transaction=temp_transaction, **item_data)

            # Apply calculation logic without saving
            self._calculate_item_totals(temp_item)
            
            # Add to processed items and track totals
            total_netto += temp_item.netto
            # Convert to dictionary for response
            item_dict = {
                'stock_id': temp_item.stock.id if temp_item.stock else None,
                'stock_code': temp_item.stock_code,
                'stock_name': temp_item.stock_name,
                'stock_price_buy': float(temp_item.stock_price_buy),
                'quantity': float(temp_item.quantity),
                'sell_price': float(temp_item.sell_price) if temp_item.sell_price else 0,
                'disc': float(temp_item.disc) if temp_item.disc else 0,
                'disc_percent': float(temp_item.disc_percent or 0),
                'disc_percent2': float(temp_item.disc_percent2 or 0),
                'total': float(temp_item.total),
                'netto': float(temp_item.netto)
            }
            processed_items.append(item_dict)
        
        # Apply transaction-level calculations
        th_total = total_netto
        
        if temp_transaction.th_disc:
            discount_amount = th_total * (temp_transaction.th_disc / Decimal('100'))
            th_total -= discount_amount
            
        if temp_transaction.th_ppn:
            tax_amount = th_total * (temp_transaction.th_ppn / Decimal('100'))
            th_total += tax_amount
        
        th_round = Decimal('0.00')
        last_two_digits = th_total % Decimal('100')
        if last_two_digits > Decimal('0'):
            th_round = Decimal('100') - last_two_digits
            th_total += th_round

        # Calculate potential loyalty points
        potential_points = 0
        if temp_transaction.th_type == 'SALE':
            potential_points = self._calculate_points(processed_items)
        
        # Prepare response
        result = {
            'th_code': f"PREVIEW-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            'items': processed_items,
            'subtotal': float(total_netto),
            'th_disc': float(temp_transaction.th_disc) if temp_transaction.th_disc else 0,
            'th_ppn': float(temp_transaction.th_ppn) if temp_transaction.th_ppn else 0,
            'th_total': float(th_total),
            'th_round': float(th_round),
            'potential_points': potential_points,
            'is_preview': True
        }
        
        return Response(result)
    
    def _calculate_item_totals(self, item):
        """Helper method to calculate item totals without saving to database"""
        # Replicate the calculation logic from TransItemDetail.save()
        if item.transaction.th_type == 'SALE':
            # Get price based on customer category - simplified for preview
            item.sell_price = item.sell_price or item.stock.hpp
            
            # Calculate totals
            item.total = item.quantity * (item.sell_price or Decimal('0'))
            
            # Apply item-level discounts
            price_after_disc = item.sell_price - (item.disc or Decimal('0'))
            price_after_disc1 = (price_after_disc or Decimal('0')) * (Decimal('1') - Decimal(item.disc_percent or 0) / Decimal('100'))
            price_after_disc2 = price_after_disc1 * (Decimal('1') - Decimal(item.disc_percent2 or 0) / Decimal('100'))
            
            
            # Calculate netto
            item.netto = item.quantity * price_after_disc2
            
            # Apply transaction-level discounts and taxes 
            # (This is simplified for preview; actual logic may differ)
            # if item.transaction.th_disc:
            #     item.netto -= item.netto * (item.transaction.th_disc / Decimal('100'))
                
            # if item.transaction.th_ppn:
            #     item.netto += item.netto * (item.transaction.th_ppn / Decimal('100'))
        
        elif item.transaction.th_type == 'PURCHASE':
            # Similar logic for purchase items
            item.total = item.quantity * (item.stock_price_buy or Decimal('0'))
            
            price_after_disc = item.sell_price - (item.disc or Decimal('0'))
            price_after_disc1 = (item.stock_price_buy or Decimal('0')) * (Decimal('1') - Decimal(item.disc_percent or 0) / Decimal('100'))
            price_after_disc2 = price_after_disc1 * (Decimal('1') - Decimal(item.disc_percent2 or 0) / Decimal('100'))
            
            item.netto = item.quantity * price_after_disc2
            
            # if item.transaction.th_disc:
            #     item.netto -= item.netto * (item.transaction.th_disc / Decimal('100'))
                
            # if item.transaction.th_ppn:
            #     item.netto += item.netto * (item.transaction.th_ppn / Decimal('100'))
    
    def _calculate_points(self, items):
        """Calculate potential loyalty points for preview"""
        excluded_categories = TransactionHistory.EXCLUDED_CATEGORIES
        total_amount = Decimal('0')
        
        for item in items:
            # In a real implementation, you'd need to check the stock category
            # This is simplified for the preview
            stock_id = item.get('stock_id')
            if stock_id:
                try:
                    stock = Stock.objects.get(id=stock_id)
                    if stock.category not in excluded_categories:
                        total_amount += Decimal(str(item['sell_price'])) * Decimal(str(item['quantity']))
                except Stock.DoesNotExist:
                    pass
        
        # Calculate points: every 100000 = 2 points
        points = int(total_amount // Decimal('100000')) * 2
        return points
    @extend_schema(
        summary="Get price history for transaction items",
        description=(
            "Retrieve the last 10 price changes and current active prices for each stock item "
            "in a given transaction. Useful for analyzing price trends and audit purposes."
        ),
        responses={
            200: OpenApiExample(
                'Price history response',
                value=[
                    {
                        "stock_id": 1,
                        "stock_code": "SKU-001",
                        "stock_name": "Item A",
                        "current_prices": [
                            {
                                "category": "Retail",
                                "price": 12000.0,
                                "is_default": True
                            },
                            {
                                "category": "Wholesale",
                                "price": 11000.0,
                                "is_default": False
                            }
                        ],
                        "price_history": [
                            {
                                "date": "2025-05-03 14:20",
                                "price_category": "Retail",
                                "old_price": 10000.0,
                                "new_price": 12000.0,
                                "changed_by": "admin",
                                "reason": "Quarterly adjustment"
                            },
                            {
                                "date": "2025-04-01 09:15",
                                "price_category": "Retail",
                                "old_price": 9500.0,
                                "new_price": 10000.0,
                                "changed_by": "manager",
                                "reason": "Cost update"
                            }
                        ]
                    }
                ],
                response_only=True
            ),
            500: OpenApiExample(
                'Server error',
                value={"error": "Unexpected error message"},
                response_only=True
            )
        },
        tags=["Transactions"]
    )
    @action(detail=True, methods=['get'])
    def get_price_history(self, request, pk=None):
        """
        Get the price history for all items in a transaction.
        This helps in analyzing how prices have changed over time.
        """
        try:
            transaction = self.get_object()
            items = transaction.items.all()
            
            result = []
            for item in items:
                stock_id = item.stock_id
                if stock_id:
                    # Get price history for this stock
                    price_history = StockPriceHistory.objects.filter(
                        stock_id=stock_id
                    ).order_by('-created_at')[:10]  # Get the last 10 price changes
                    
                    history = []
                    for ph in price_history:
                        history.append({
                            'date': ph.created_at.strftime('%Y-%m-%d %H:%M'),
                            'old_price': float(ph.old_price),
                            'new_price': float(ph.new_price),
                            'changed_by': ph.changed_by.username if ph.changed_by else 'System',
                            'reason': ph.change_reason
                        })
                    
                    result.append({
                        'stock_id': stock_id,
                        'stock_code': item.stock_code,
                        'stock_name': item.stock_name,
                        'current_price': float(item.sell_price),
                        'price_history': history
                    })
            
            return Response(result)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
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