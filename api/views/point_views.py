from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from ..models import PointTransaction, Customer, TransactionHistory
from ..serializers import (
    PointTransactionSerializer, 
    PointTransactionCreateSerializer,
    CustomerPointSummarySerializer,
    RedeemPointsSerializer
)
@extend_schema_view(
    list=extend_schema(
        summary="List point transactions",
        description="Get a list of all point transactions with pagination, filtering, and search capabilities.",
        responses={200: PointTransactionSerializer(many=True)},
        tags=["Points"]
    ),
    retrieve=extend_schema(
        summary="Retrieve point transaction",
        description="Get detailed information about a specific point transaction.",
        responses={200: PointTransactionSerializer},
        tags=["Points"]
    ),
    create=extend_schema(
        summary="Create point transaction",
        description="Create a new point transaction for a customer.",
        request=PointTransactionCreateSerializer,
        responses={201: PointTransactionSerializer},
        tags=["Points"]
    ),
    update=extend_schema(
        summary="Update point transaction",
        description="Update an existing point transaction's information.",
        request=PointTransactionCreateSerializer,
        responses={200: PointTransactionSerializer},
        tags=["Points"]
    ),
    partial_update=extend_schema(
        summary="Partial update point transaction",
        description="Update one or more fields of an existing point transaction.",
        request=PointTransactionCreateSerializer,
        responses={200: PointTransactionSerializer},
        tags=["Points"]
    ),
    destroy=extend_schema(
        summary="Delete point transaction",
        description="Delete an existing point transaction.",
        responses={204: None},
        tags=["Points"]
    )
)
class PointTransactionViewSet(viewsets.ModelViewSet):
    queryset = PointTransaction.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'transaction_type', 'created_at']
    search_fields = ['customer__name', 'transaction__th_code', 'note']
    ordering_fields = ['created_at', 'points', 'balance_after']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PointTransactionCreateSerializer
        return PointTransactionSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context
    
    def perform_create(self, serializer):
        serializer.save()

    @extend_schema(
        summary="Get customer point history",
        description="Retrieve point transaction history for a specific customer with optional date filtering.",
        parameters=[
            OpenApiParameter(
                name='customer_id',
                description='ID of the customer',
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='start_date',
                description='Start date for filtering (YYYY-MM-DD)',
                required=False,
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='end_date',
                description='End date for filtering (YYYY-MM-DD)',
                required=False,
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY
            ),
        ],
        responses={
            200: PointTransactionSerializer(many=True),
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        },
        tags=["Points"]
    )
    @action(detail=False, methods=['get'])
    def customer_history(self, request):
        """Get point history for a specific customer"""
        customer_id = request.query_params.get('customer_id')
        if not customer_id:
            return Response(
                {"error": "customer_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            customer = Customer.objects.get(pk=customer_id)
        except Customer.DoesNotExist:
            return Response(
                {"error": "Customer not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Optional date filtering
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        transactions = customer.point_transactions.all().order_by('-created_at')
        
        if start_date:
            transactions = transactions.filter(created_at__gte=start_date)
        
        if end_date:
            transactions = transactions.filter(created_at__lte=end_date)
            
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get point summary by transaction type",
        description="Get aggregated point summary grouped by transaction type for a specific customer.",
        parameters=[
            OpenApiParameter(
                name='customer_id',
                description='ID of the customer',
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY
            ),
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        },
        tags=["Points"]
    )
    @action(detail=False, methods=['get'])
    def summary_by_type(self, request):
        """Get point summary grouped by transaction type"""
        customer_id = request.query_params.get('customer_id')
        if not customer_id:
            return Response(
                {"error": "customer_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            customer = Customer.objects.get(pk=customer_id)
        except Customer.DoesNotExist:
            return Response(
                {"error": "Customer not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get points by transaction type
        from django.db.models import Sum
        summary = PointTransaction.objects.filter(
            customer=customer
        ).values('transaction_type').annotate(
            total=Sum('points')
        ).order_by('transaction_type')
        
        return Response(summary)
    
@extend_schema_view(
    list=extend_schema(
        summary="List customers with points",
        description="Get a list of all customers with their point information, including search capabilities.",
        responses={200: CustomerPointSummarySerializer(many=True)},
        tags=["Points"]
    ),
    retrieve=extend_schema(
        summary="Retrieve customer points",
        description="Get detailed point information for a specific customer.",
        responses={200: CustomerPointSummarySerializer},
        tags=["Points"]
    )
)
class CustomerPointsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerPointSummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']
    
    @extend_schema(
        summary="Adjust customer points",
        description="Manually adjust points for a customer by adding or subtracting points.",
        request={
            'type': 'object',
            'properties': {
                'points': {
                    'type': 'number',
                    'description': 'Points to adjust (positive to add, negative to subtract)'
                },
                'note': {
                    'type': 'string',
                    'description': 'Note for the adjustment',
                    'default': 'Manual adjustment'
                }
            },
            'required': ['points']
        },
        responses={
            200: CustomerPointSummarySerializer,
            400: OpenApiTypes.OBJECT
        },
        tags=["Points"]
    )
    @action(detail=True, methods=['post'])
    def adjust_points(self, request, pk=None):
        """Manually adjust points for a customer"""
        customer = self.get_object()
        
        points = request.data.get('points')
        note = request.data.get('note', 'Manual adjustment')
        
        if not points:
            return Response(
                {"error": "points parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            points = float(points)
        except ValueError:
            return Response(
                {"error": "points must be a valid number"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the point transaction
        point_transaction = customer.adjust_points(points, note, request.user)
        
        # Return the updated customer data
        serializer = CustomerPointSummarySerializer(customer)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get customer transaction history",
        description="Retrieve transaction history for a specific customer with optional date filtering.",
        parameters=[
            OpenApiParameter(
                name='start_date',
                description='Start date for filtering (YYYY-MM-DD)',
                required=False,
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='end_date',
                description='End date for filtering (YYYY-MM-DD)',
                required=False,
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY
            ),
        ],
        responses={200: PointTransactionSerializer(many=True)},
        tags=["Points"]
    )
    @action(detail=True, methods=['get'])
    def transaction_history(self, request, pk=None):
        """Get transaction history for a customer"""
        customer = self.get_object()
        
        # Optional date filtering
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        transactions = customer.get_point_history(start_date, end_date)
        
        # Pagination
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(transactions, request)
        
        if page is not None:
            serializer = PointTransactionSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
            
        serializer = PointTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Check expired points",
        description="Check and process expired points for a customer.",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'expired_points': {'type': 'number'},
                    'current_balance': {'type': 'number'}
                }
            }
        },
        tags=["Points"]
    )
    @action(detail=True, methods=['post'])
    def check_expired(self, request, pk=None):
        """Check and process expired points"""
        customer = self.get_object()
        expired = customer.check_expired_points()
        
        return Response({
            "expired_points": expired,
            "current_balance": customer.point
        })
    
@extend_schema(
    summary="Redeem points",
    description="Redeem points for a specific transaction.",
    request=RedeemPointsSerializer,
    responses={
        200: {
            'type': 'object',
            'properties': {
                'success': {'type': 'boolean'},
                'message': {'type': 'string'},
                'customer_balance': {'type': 'number'}
            }
        },
        400: {
            'type': 'object',
            'properties': {
                'success': {'type': 'boolean'},
                'message': {'type': 'string'}
            }
        },
        404: {
            'type': 'object',
            'properties': {
                'success': {'type': 'boolean'},
                'message': {'type': 'string'}
            }
        }
    },
    tags=["Points"]
)
class RedeemPointsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = RedeemPointsSerializer(data=request.data)
        if serializer.is_valid():
            transaction_id = serializer.validated_data['transaction_id']
            points = serializer.validated_data['points']
            
            try:
                transaction = TransactionHistory.objects.get(pk=transaction_id)
                success = transaction.redeem_points(points, request.user)
                
                if success:
                    return Response({
                        "success": True,
                        "message": f"Successfully redeemed {points} points",
                        "customer_balance": transaction.customer.point
                    })
                else:
                    return Response({
                        "success": False,
                        "message": "Failed to redeem points"
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except TransactionHistory.DoesNotExist:
                return Response({
                    "success": False,
                    "message": "Transaction not found"
                }, status=status.HTTP_404_NOT_FOUND)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)