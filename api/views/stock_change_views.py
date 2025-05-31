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
from ..serializers import StockChangeDetailSerializer

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