from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count, Case, When, DecimalField
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse
from ..models import ARAP, TransactionHistory, TransactionType
from ..serializers import ARAPSerializer, ARAPPaymentSerializer, TransactionHistorySerializer


@extend_schema_view(
    list=extend_schema(
        summary="List ARAP records",
        description="Get a list of all Accounts Receivable/Accounts Payable records with filtering capabilities.",
        responses={200: ARAPSerializer(many=True)},
        tags=["ARAP"]
    ),
    retrieve=extend_schema(
        summary="Retrieve ARAP record",
        description="Get detailed information about a specific ARAP record.",
        responses={200: ARAPSerializer},
        tags=["ARAP"]
    ),
    create=extend_schema(
        summary="Create ARAP record",
        description="Create a new ARAP record.",
        responses={201: ARAPSerializer},
        tags=["ARAP"]
    ),
    update=extend_schema(
        summary="Update ARAP record",
        description="Update an existing ARAP record.",
        responses={200: ARAPSerializer},
        tags=["ARAP"]
    ),
    partial_update=extend_schema(
        summary="Partial update ARAP record",
        description="Update one or more fields of an existing ARAP record.",
        responses={200: ARAPSerializer},
        tags=["ARAP"]
    ),
    destroy=extend_schema(
        summary="Delete ARAP record",
        description="Delete an existing ARAP record.",
        responses={204: None},
        tags=["ARAP"]
    )
)
class ARAPViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling CRUD operations on Accounts Receivable/Accounts Payable records.
    Provides filtering, searching and additional endpoints for common ARAP operations.
    """
    queryset = ARAP.objects.all()
    serializer_class = ARAPSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_receivable', 'is_settled', 'due_date']
    search_fields = ['transaction__th_number', 'transaction__th_note', 
                     'transaction__supplier__supplier_name', 'transaction__customer__customer_name']
    ordering_fields = ['due_date', 'total_amount', 'amount_paid', 'transaction__th_date']
    
    def get_queryset(self):
        """
        Extends the base queryset with additional filtering options from query parameters.
        """
        queryset = ARAP.objects.all()
        
        # Filter by transaction type
        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(transaction__th_type=transaction_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(transaction__th_date__range=[start_date, end_date])
        
        # Filter by customer or supplier
        customer_id = self.request.query_params.get('customer_id')
        supplier_id = self.request.query_params.get('supplier_id')
        if customer_id:
            queryset = queryset.filter(transaction__customer_id=customer_id)
        if supplier_id:
            queryset = queryset.filter(transaction__supplier_id=supplier_id)
            
        # Filter overdue records
        overdue = self.request.query_params.get('overdue')
        if overdue and overdue.lower() == 'true':
            from django.utils import timezone
            today = timezone.now().date()
            queryset = queryset.filter(
                Q(due_date__lt=today) & 
                Q(is_settled=False)
            )
            
        return queryset
    
    @extend_schema(
        summary="Record payment against ARAP",
        description="Record a payment against an ARAP record and update its payment status.",
        request={"application/json": {"type": "object", "properties": {"amount": {"type": "number"}}}},
        responses={200: ARAPSerializer},
        tags=["ARAP"]
    )
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """
        Record a payment against an ARAP record.
        Expects 'amount' in the request data.
        """
        arap = self.get_object()
        amount = request.data.get('amount')
        
        if not amount:
            return Response(
                {"error": "Payment amount is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = float(amount)
        except ValueError:
            return Response(
                {"error": "Invalid amount format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the amount paid
        arap.amount_paid += amount
        arap.save()  # This will also update is_settled via model's save method
        
        return Response(self.get_serializer(arap).data)
    
    @extend_schema(
        summary="Get receivables only",
        description="Get all accounts receivable records.",
        responses={200: ARAPSerializer(many=True)},
        tags=["ARAP"]
    )
    @action(detail=False, methods=['get'])
    def receivables(self, request):
        """Get all accounts receivable"""
        queryset = self.get_queryset().filter(is_receivable=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get payables only",
        description="Get all accounts payable records.",
        responses={200: ARAPSerializer(many=True)},
        tags=["ARAP"]
    )
    @action(detail=False, methods=['get'])
    def payables(self, request):
        """Get all accounts payable"""
        queryset = self.get_queryset().filter(is_receivable=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get ARAP summary",
        description="Get summary statistics of ARAP records including totals and counts for receivables and payables.",
        responses={200: OpenApiResponse(description="ARAP Summary")},
        tags=["ARAP"]
    )
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary statistics of ARAP
        """
        # Get all ARAP records based on filters
        queryset = self.get_queryset()
        
        # Calculate summaries
        summary = queryset.aggregate(
            total_receivables=Sum(
                Case(
                    When(is_receivable=True, then='total_amount'),
                    default=0,
                    output_field=DecimalField()
                )
            ),
            total_payables=Sum(
                Case(
                    When(is_receivable=False, then='total_amount'),
                    default=0,
                    output_field=DecimalField()
                )
            ),
            receivables_paid=Sum(
                Case(
                    When(is_receivable=True, then='amount_paid'),
                    default=0,
                    output_field=DecimalField()
                )
            ),
            payables_paid=Sum(
                Case(
                    When(is_receivable=False, then='amount_paid'),
                    default=0,
                    output_field=DecimalField()
                )
            ),
            receivables_count=Count(
                Case(
                    When(is_receivable=True, then=1)
                )
            ),
            payables_count=Count(
                Case(
                    When(is_receivable=False, then=1)
                )
            ),
            settled_count=Count(
                Case(
                    When(is_settled=True, then=1)
                )
            ),
            outstanding_count=Count(
                Case(
                    When(is_settled=False, then=1)
                )
            )
        )
        
        # Calculate derived metrics
        if summary['total_receivables'] is not None:
            summary['receivables_outstanding'] = summary['total_receivables'] - summary['receivables_paid']
        else:
            summary['receivables_outstanding'] = 0
            
        if summary['total_payables'] is not None:
            summary['payables_outstanding'] = summary['total_payables'] - summary['payables_paid']
        else:
            summary['payables_outstanding'] = 0
        
        return Response(summary)


@extend_schema_view(
    create=extend_schema(
        summary="Create ARAP payment",
        description="Create a payment transaction for an ARAP record.",
        request=ARAPPaymentSerializer,
        responses={201: ARAPSerializer},
        tags=["ARAP Payments"]
    )
)
class ARAPPaymentViewSet(viewsets.GenericViewSet):
    """
    ViewSet for handling payment operations on ARAP records.
    Provides functionality to create payments and view payment history.
    """
    queryset = ARAP.objects.all()
    serializer_class = ARAPPaymentSerializer
    
    def create(self, request):
        """
        Create a payment for an ARAP record.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment_transaction = serializer.save()
        
        # Return the updated ARAP record
        arap_id = request.data.get('arap_id')
        arap = ARAP.objects.get(id=arap_id)
        return Response(ARAPSerializer(arap).data, status=status.HTTP_201_CREATED)
    
    @extend_schema(
        summary="Get payment history",
        description="Get payment history for a specific ARAP record.",
        parameters=[
            OpenApiParameter(
                name="arap_id",
                description="ARAP record ID",
                required=True,
                type=int
            )
        ],
        responses={200: TransactionHistorySerializer(many=True)},
        tags=["ARAP Payments"]
    )
    @action(detail=False, methods=['get'])
    def payment_history(self, request):
        """
        Get payment history for a specific ARAP record.
        """
        arap_id = request.query_params.get('arap_id')
        if not arap_id:
            return Response(
                {"error": "arap_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            arap = ARAP.objects.get(id=arap_id)
        except ARAP.DoesNotExist:
            return Response(
                {"error": "ARAP record not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Get all payment transactions for this ARAP
        transaction_type = TransactionType.RECEIPT if arap.is_receivable else TransactionType.PAYMENT
        payments = TransactionHistory.objects.filter(
            th_type=transaction_type,
            th_note__icontains=arap.transaction.th_number
        ).order_by('-th_date')
        
        return Response(TransactionHistorySerializer(payments, many=True).data)