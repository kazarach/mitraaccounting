from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Sum, F, Case, When, DecimalField, Max
from decimal import Decimal
from django.utils.dateparse import parse_date
from datetime import datetime, timedelta
from collections import defaultdict
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.openapi import OpenApiTypes
from ..models import TransItemDetail, TransactionHistory, Stock
from ..serializers import StockChangeSerializer, StockChangeDetailSerializer

# class StockChangesAPIView(APIView):
#     """
#     API to get all stock changes for a specific date
#     """

#     @extend_schema(
#         summary="Get stock changes for a specific date range",
#         description="Retrieve all stock movements and changes that occurred within a date range. "
#                    "This includes purchases, sales, adjustments, and returns with detailed analysis.",
#         parameters=[
#             OpenApiParameter(
#                 name='start_date',
#                 type=OpenApiTypes.DATE,
#                 location=OpenApiParameter.QUERY,
#                 required=True,
#                 description='Start date for history range (YYYY-MM-DD format)',
#             ),
#             OpenApiParameter(
#                 name='end_date',
#                 type=OpenApiTypes.DATE,
#                 location=OpenApiParameter.QUERY,
#                 required=True,
#                 description='End date for history range (YYYY-MM-DD format)',
#             ),
#             OpenApiParameter(
#                 name='stock_code',
#                 type=OpenApiTypes.STR,
#                 location=OpenApiParameter.QUERY,
#                 required=False,
#                 description='Filter results by specific stock code (partial match)',
#             ),
#             OpenApiParameter(
#                 name='include_details',
#                 type=OpenApiTypes.BOOL,
#                 location=OpenApiParameter.QUERY,
#                 required=False,
#                 description='Include detailed transaction information for each stock',
#             ),
#             OpenApiParameter(
#                 name='include_stock_details',
#                 type=OpenApiTypes.BOOL,
#                 location=OpenApiParameter.QUERY,
#                 required=False,
#                 description='Include full stock information using Stock serializer',
#             )
#         ],
#         responses={
#             200: OpenApiExample(
#                 'Stock changes retrieved successfully',
#                 value={
#                     "date_range": {
#                         "start_date": "2024-01-15",
#                         "end_date": "2024-01-20"
#                     },
#                     "total_stocks_changed": 5,
#                     "summary": {
#                         "total_items_in": "150.00",
#                         "total_items_out": "75.50",
#                         "net_change": "74.50"
#                     },
#                     "stock_changes": [
#                         {
#                             "stock_id": 1,
#                             "stock_code": "ABC123",
#                             "stock_name": "Sample Product",
#                             "total_in": "50.00",
#                             "total_out": "25.00",
#                             "net_change": "25.00",
#                             "latest_buy_price": "10.50",
#                             "latest_sell_price": "15.75",
#                             "transactions": []
#                         }
#                     ]
#                 },
#                 response_only=True
#             ),
#             400: OpenApiExample(
#                 'Invalid request parameters',
#                 value={
#                     "error": "Start date and end date parameters are required (YYYY-MM-DD format)"
#                 },
#                 response_only=True
#             )
#         },
#         tags=["Stock Changes"]
#     )

#     def get(self, request):
#         stock_code = request.query_params.get('stock_code')  # Optional filter by stock code
#         include_details = request.query_params.get('include_details', 'false').lower() == 'true'
#         include_stock_details = request.query_params.get('include_stock_details', 'false').lower() == 'true'
        
#         # Store in view for serializer context
#         self.include_stock_details = include_stock_details
        
#         # Get date range parameters
#         start_date = request.query_params.get('start_date')
#         end_date = request.query_params.get('end_date')
        
#         # Validate date parameters
#         if not start_date or not end_date:
#             return Response({
#                 "error": "Start date and end date parameters are required (YYYY-MM-DD format)"
#             }, status=400)
        
#         # Base queryset for transactions in the date range
#         base_query = TransItemDetail.objects.filter(
#             transaction__th_date__range=(start_date, end_date),
#             transaction__th_status=True  # Only active transactions
#         ).select_related('transaction', 'stock')
        
#         # Filter by stock code if provided
#         if stock_code:
#             base_query = base_query.filter(stock_code__icontains=stock_code)
        
#         # Group by stock and calculate changes
#         stock_changes = defaultdict(lambda: {
#             'stock_id': None,
#             'stock_code': '',
#             'stock_name': '',
#             'total_in': Decimal('0'),
#             'total_out': Decimal('0'),
#             'latest_buy_price': None,
#             'latest_sell_price': None,
#             'transactions': []
#         })
        
#         # Process each transaction item
#         for item in base_query:
#             stock_key = item.stock_code
            
#             # Initialize stock info
#             if not stock_changes[stock_key]['stock_id']:
#                 stock_changes[stock_key].update({
#                     'stock_id': item.stock.id,
#                     'stock_code': item.stock_code,
#                     'stock_name': item.stock_name,
#                 })
            
#             # Determine if this is stock in or out based on transaction type and quantity
#             transaction_type = item.transaction.th_type
#             quantity = item.quantity
            
#             # Classify transaction types
#             stock_in_types = ['PURCHASE', 'PURCHASE_RETURN']
#             stock_out_types = ['SALE', 'SALE_RETURN', 'EXPENSE', 'USAGE']
#             adjustment_types = ['ADJUSTMENT']  # These can be positive or negative
            
#             if transaction_type in stock_in_types:
#                 stock_changes[stock_key]['total_in'] += abs(quantity)  # Always positive for stock in
#             elif transaction_type in stock_out_types:
#                 stock_changes[stock_key]['total_out'] += abs(quantity)  # Always positive for stock out
#             elif transaction_type in adjustment_types:
#                 # For adjustments, use the sign of quantity to determine in/out
#                 if quantity > 0:
#                     stock_changes[stock_key]['total_in'] += quantity
#                 elif quantity < 0:
#                     stock_changes[stock_key]['total_out'] += abs(quantity)
#             else:
#                 # For any other transaction types, determine by quantity sign
#                 if quantity > 0:
#                     stock_changes[stock_key]['total_in'] += quantity
#                 elif quantity < 0:
#                     stock_changes[stock_key]['total_out'] += abs(quantity)
            
#             # Update latest prices
#             if item.stock_price_buy:
#                 stock_changes[stock_key]['latest_buy_price'] = item.stock_price_buy
#             if item.sell_price:
#                 stock_changes[stock_key]['latest_sell_price'] = item.sell_price
            
#             # Add transaction details if requested
#             if include_details:
#                 transaction_detail = {
#                     'transaction_id': item.transaction.id,
#                     'transaction_code': item.transaction.th_code,
#                     'transaction_type': transaction_type,
#                     'transaction_time': item.transaction.th_date,
#                     'quantity': quantity,
#                     'buy_price': item.stock_price_buy,
#                     'sell_price': item.sell_price,
#                     'customer': item.transaction.customer.name if item.transaction.customer else None,
#                     'supplier': item.transaction.supplier.name if item.transaction.supplier else None,
#                 }
#                 stock_changes[stock_key]['transactions'].append(transaction_detail)
        
#         # Calculate net changes and prepare response
#         result = []
#         for stock_data in stock_changes.values():
#             stock_data['net_change'] = stock_data['total_in'] - stock_data['total_out']
            
#             # Sort transactions by time if details are included
#             if include_details:
#                 stock_data['transactions'].sort(key=lambda x: x['transaction_time'])
            
#             result.append(stock_data)
        
#         # Sort by stock code
#         result.sort(key=lambda x: x['stock_code'])
        
#         # Serialize the data
#         serializer = StockChangeSerializer(result, many=True, context={'view': self, 'request': request})
        
#         return Response({
#             'date_range': {
#                 'start_date': start_date,
#                 'end_date': end_date
#             },
#             'total_stocks_changed': len(result),
#             'summary': {
#                 'total_items_in': sum(item['total_in'] for item in result),
#                 'total_items_out': sum(item['total_out'] for item in result),
#                 'net_change': sum(item['net_change'] for item in result),
#             },
#             'stock_changes': serializer.data
#         })

class StockChangeHistoryAPIView(APIView):
    """
    API to get stock change history for a specific stock over a date range
    """
    @extend_schema(
        summary="Get stock change history for specific stock",
        description="Retrieve detailed transaction history for a specific stock over a date range. "
                   "Shows all movements including purchases, sales, adjustments, and returns.",
        parameters=[
            OpenApiParameter(
                name='stock',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Stock code to get history for (exact match)',
            ),
            OpenApiParameter(
                name='start_date',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Start date for history range (YYYY-MM-DD format)',
            ),
            OpenApiParameter(
                name='end_date',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                required=True,
                description='End date for history range (YYYY-MM-DD format)',
            )
        ],
        responses={
            200: OpenApiExample(
                'Stock history retrieved successfully',
                value={
                    "stock": 13,
                    "date_range": "2024-01-01 to 2024-01-31",
                    "total_transactions": 12,
                    "transactions": [
                        {
                            "transaction_id": 1,
                            "transaction_code": "PUR-2024-001",
                            "transaction_type": "PURCHASE",
                            "transaction_time": "2024-01-15T10:30:00Z",
                            "quantity": "50.00",
                            "buy_price": "10.50",
                            "sell_price": "15.75",
                            "customer": None,
                            "supplier": "ABC Supplier"
                        }
                    ]
                },
                response_only=True
            ),
            400: OpenApiExample(
                'Invalid request parameters',
                value={
                    "error": "stock, start_date, and end_date parameters are required"
                },
                response_only=True
            )
        },
        tags=["Stock Changes"]
    )

    def get(self, request):
        stock = request.query_params.get('stock')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not all([stock, start_date, end_date]):
            return Response({
                "error": "stock, start_date, and end_date parameters are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            start_date_obj = parse_date(start_date)
            end_date_obj = parse_date(end_date)
            if not start_date_obj or not end_date_obj:
                raise ValueError("Invalid date format")
        except ValueError:
            return Response({
                "error": "Invalid date format. Use YYYY-MM-DD"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        transactions = TransItemDetail.objects.filter(
            stock=stock,
            transaction__th_date__date__range=(start_date_obj, end_date_obj),
            transaction__th_status=True
        ).select_related('transaction').order_by('transaction__th_date')

        # Serialize transaction details
        transaction_details = []
        for item in transactions:
            detail = {
                'transaction_id': item.transaction.id,
                'transaction_code': item.transaction.th_code,
                'transaction_type': item.transaction.th_type,
                'transaction_time': item.transaction.th_date,
                'quantity': item.quantity,
                'stock_quantity': item.stock.quantity,
                'stock_changed_to': item.stock.quantity+item.quantity,
                'buy_price': item.stock_price_buy,
                'sell_price': item.sell_price,
                'customer': item.transaction.customer.name if item.transaction.customer else None,
                'supplier': item.transaction.supplier.name if item.transaction.supplier else None,
            }
            transaction_details.append(detail)
                
        # Check if serializer is working
        try:
            serializer = StockChangeDetailSerializer(transaction_details, many=True)
            serialized_data = serializer.data
        except Exception as e:
            # Return raw data if serializer fails
            serialized_data = transaction_details
        
        response_data = {
            'stock': stock,
            'date_range': f"{start_date} to {end_date}",
            'total_transactions': len(transaction_details),
            'transactions': serialized_data
        }

        return Response(response_data)