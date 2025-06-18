from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count, Case, When, DecimalField, F, Value, Min, Max
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse, OpenApiRequest, OpenApiExample
from decimal import Decimal
from django.utils import timezone
from ..models import ARAP, ARAPTransaction, TransactionHistory, TransactionType
from ..serializers import ARAPSerializer, ARAPTransactionSerializer, ARAPPaymentSerializer, TransactionHistorySerializer, ARAPSummarySerializer, ARAPPaymentInputSerializer


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
    filterset_fields = ['is_receivable', 'supplier', 'customer']
    search_fields = ['supplier__name', 'customer__name']
    ordering_fields = ['total_amount', 'total_paid']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Extends the base queryset with additional filtering options from query parameters.
        """
        queryset = ARAP.objects.all().prefetch_related('transactions')

        # Filter by entity type
        is_receivable = self.request.query_params.get('is_receivable')
        if is_receivable is not None:
            is_receivable = is_receivable.lower() == 'true'
            queryset = queryset.filter(is_receivable=is_receivable)
        
        # Filter by settled status
        is_settled = self.request.query_params.get('is_settled')
        if is_settled is not None:
            # For settled status, we need to check if total_paid >= total_amount
            is_settled = is_settled.lower() == 'true'
            if is_settled:
                queryset = queryset.filter(total_paid__gte=F('total_amount'))
            else:
                queryset = queryset.filter(total_paid__lt=F('total_amount'))
            
        # Filter by date range for transactions
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(transactions__due_date__range=[start_date, end_date]).distinct()
        
        # Filter overdue records
        overdue = self.request.query_params.get('overdue')
        if overdue and overdue.lower() == 'true':
            from django.utils import timezone
            today = timezone.now().date()
            queryset = queryset.filter(
                transactions__due_date__lt=today,
                total_paid__lt=F('total_amount')
            ).distinct()
            
        return queryset
    
    @extend_schema(
        summary="Get ARAP by supplier",
        description="Get ARAP records grouped by supplier.",
        responses={200: ARAPSummarySerializer(many=True)},
        tags=["ARAP"]
    )
    @action(detail=False, methods=['get'])
    def by_supplier(self, request):
        """
        Get ARAP data grouped by supplier.
        """
        supplier_summary = ARAP.objects.filter(
            is_receivable=False,
            supplier__isnull=False
        ).values(
            'supplier'
        ).annotate(
            entity_id=F('supplier'),
            entity_name=F('supplier__name'),
            total_amount=Sum('total_amount'),
            total_paid=Sum('total_paid'),
            remaining=Sum(F('total_amount') - F('total_paid')),
            transaction_count=Count('transactions')
        ).order_by('supplier__name')
        
        serializer = ARAPSummarySerializer(supplier_summary, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get ARAP by customer",
        description="Get ARAP records grouped by customer.",
        responses={200: ARAPSummarySerializer(many=True)},
        tags=["ARAP"]
    )
    @action(detail=False, methods=['get'])
    def by_customer(self, request):
        """
        Get ARAP data grouped by customer.
        """
        customer_summary = ARAP.objects.filter(
            is_receivable=True,
            customer__isnull=False
        ).values(
            'customer'
        ).annotate(
            entity_id=F('customer'),
            entity_name=F('customer__name'),
            total_amount=Sum('total_amount'),
            total_paid=Sum('total_paid'),
            remaining=Sum(F('total_amount') - F('total_paid')),
            transaction_count=Count('transactions')
        ).order_by('customer__name')
        
        serializer = ARAPSummarySerializer(customer_summary, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get ARAP summary",
        description="Get summary statistics of ARAP records including totals and counts for receivables and payables.",
        responses={200: OpenApiResponse(description="ARAP Summary")},
        tags=["ARAP","Summary"]
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
                    When(is_receivable=True, then='total_paid'),
                    default=0,
                    output_field=DecimalField()
                )
            ),
            payables_paid=Sum(
                Case(
                    When(is_receivable=False, then='total_paid'),
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
                    When(total_paid__gte=F('total_amount'), then=1)
                )
            ),
            outstanding_count=Count(
                Case(
                    When(total_paid__lt=F('total_amount'), then=1)
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

    @extend_schema(
        summary="Add Payment to ARAP",
        description="Add a direct payment to an ARAP record without creating new transaction history.",
        request=OpenApiRequest(
            ARAPPaymentInputSerializer,
            examples=[
                OpenApiExample(
                    'Valid Payment Example',
                    value={
                        "amount": "550000.00",
                        "payment_method": "CASH",
                        "bank": None,
                        "notes": "Pembayaran tunai langsung ke kasir",
                        "allocation_strategy": "FIFO",
                        "arap_transaction_id": 123
                    },
                    request_only=True,
                )
            ]
        ),
        responses={
            201: OpenApiResponse(
                response=ARAPPaymentInputSerializer,  # as previously discussed
                description="Payment successfully created and allocated."
            ),
            400: OpenApiResponse(
                description="Validation error or business logic failure."
            )
        },
        tags=["ARAP Payments"]
    )
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """
        Add a payment directly to this ARAP record.
        """
        try:
            arap = self.get_object()
            amount = Decimal(str(request.data.get('amount', 0)))
            payment_method = request.data.get('payment_method', 'CASH')
            bank = request.data.get('bank')
            notes = request.data.get('notes', '')
            allocation_strategy = request.data.get('allocation_strategy', 'FIFO')
            arap_transaction_id = request.data.get('arap_transaction_id')  # <-- New

            if amount <= 0:
                return Response(
                    {'error': 'Payment amount must be positive'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            result = self._allocate_payment(arap, amount, allocation_strategy, arap_transaction_id)

            if 'error' in result:
                return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)

            from ..models.payment_record import Payment
            payment = Payment.objects.create(
                arap=arap,
                payment_type='ADDITIONAL',
                amount=result['allocated_amount'],
                payment_method=payment_method,
                bank=bank,
                recorded_by=request.user,
                payment_date=timezone.now().date(),
                notes=notes or f"Pembayaran untuk {arap}",
                status='COMPLETED'
            )

            arap.total_paid += result['allocated_amount']
            arap.save()

            return Response({
                'payment_id': payment.id,
                'allocated_amount': str(result['allocated_amount']),
                'remaining_payment': str(result['remaining_payment']),
                'updated_transactions': len(result['updated_transactions']),
                'arap_remaining': str(arap.remaining_amount())
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    
    @extend_schema(
        summary="Get payment schedule",
        description="Get payment schedule for this ARAP record showing all unpaid transactions.",
        responses={200: ARAPTransactionSerializer(many=True)},
        tags=["ARAP"]
    )
    @action(detail=True, methods=['get'])
    def payment_schedule(self, request, pk=None):
        """
        Get payment schedule for this ARAP record.
        """
        arap = self.get_object()
        unpaid_transactions = arap.transactions.filter(
            paid__lt=F('amount')
        ).order_by('due_date')
        
        serializer = ARAPTransactionSerializer(unpaid_transactions, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get overdue information",
        description="Get overdue amount and transactions for this ARAP record.",
        responses={200: OpenApiResponse(description="Overdue information")},
        tags=["ARAP"]
    )
    @action(detail=True, methods=['get'])
    def overdue_info(self, request, pk=None):
        """
        Get overdue information for this ARAP record.
        """
        arap = self.get_object()
        today = timezone.now().date()
        
        overdue_transactions = arap.transactions.filter(
            due_date__lt=today,
            paid__lt=F('amount')
        ).order_by('due_date')
        
        total_overdue = Decimal('0.00')
        overdue_details = []
        
        for transaction in overdue_transactions:
            remaining = transaction.amount - transaction.paid
            total_overdue += remaining
            days_overdue = (today - transaction.due_date).days
            
            overdue_details.append({
                'transaction_id': transaction.id,
                'amount': str(transaction.amount),
                'paid': str(transaction.paid),
                'remaining': str(remaining),
                'due_date': transaction.due_date,
                'days_overdue': days_overdue
            })
        
        return Response({
            'total_overdue': str(total_overdue),
            'overdue_count': len(overdue_details),
            'overdue_transactions': overdue_details
        })
    
    def _allocate_payment(self, arap, amount, allocation_strategy='FIFO', arap_transaction_id=None):
        """
        Helper method to allocate payment across multiple transactions or a specific transaction.
        """
        from django.core.exceptions import ObjectDoesNotExist
        from decimal import Decimal
        from django.db.models import F

        remaining_payment = Decimal(str(amount))
        updated_transactions = []

        if arap_transaction_id:
            try:
                transaction = arap.transactions.get(id=arap_transaction_id)
            except ObjectDoesNotExist:
                return {
                    'error': f'Transaction with ID {arap_transaction_id} not found in this ARAP',
                    'allocated_amount': Decimal('0.00'),
                    'remaining_payment': remaining_payment,
                    'updated_transactions': []
                }

            transaction_remaining = transaction.amount - transaction.paid
            payment_for_this = min(remaining_payment, transaction_remaining)

            transaction.paid += payment_for_this
            transaction.is_closed = transaction.remaining_amount() <= 99
            transaction.save()

            remaining_payment -= payment_for_this
            updated_transactions.append({
                'transaction': transaction,
                'payment_amount': payment_for_this
            })

        else:
            # Get unpaid transactions based on strategy
            if allocation_strategy == 'FIFO':
                unpaid_transactions = arap.transactions.filter(paid__lt=F('amount')).order_by('created_at')
            elif allocation_strategy == 'DUE_DATE':
                unpaid_transactions = arap.transactions.filter(paid__lt=F('amount')).order_by('due_date')
            else:
                unpaid_transactions = arap.transactions.filter(paid__lt=F('amount')).order_by('id')

            for transaction in unpaid_transactions:
                if remaining_payment <= 0:
                    break

                transaction_remaining = transaction.amount - transaction.paid
                payment_for_this = min(remaining_payment, transaction_remaining)

                transaction.paid += payment_for_this
                transaction.is_closed = transaction.remaining_amount() <= 1
                transaction.save()

                remaining_payment -= payment_for_this
                updated_transactions.append({
                    'transaction': transaction,
                    'payment_amount': payment_for_this
                })

        return {
            'allocated_amount': amount - remaining_payment,
            'remaining_payment': remaining_payment,
            'updated_transactions': updated_transactions
        }



@extend_schema_view(
    list=extend_schema(
        summary="List ARAP transactions",
        description="Get a list of all ARAP transaction records.",
        responses={200: ARAPTransactionSerializer(many=True)},
        tags=["ARAP Transactions"]
    ),
    retrieve=extend_schema(
        summary="Retrieve ARAP transaction",
        description="Get detailed information about a specific ARAP transaction.",
        responses={200: ARAPTransactionSerializer},
        tags=["ARAP Transactions"]
    ),
)
class ARAPTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing ARAP transaction records.
    """
    queryset = ARAPTransaction.objects.all()
    serializer_class = ARAPTransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['arap', 'due_date']
    ordering_fields = ['due_date', 'amount', 'paid']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ARAPTransaction.objects.all()
        
        # Filter by ARAP ID
        arap_id = self.request.query_params.get('arap_id')
        if arap_id:
            queryset = queryset.filter(arap_id=arap_id)
            
        # Filter by amount range
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)
            
        # Filter by due date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(due_date__range=[start_date, end_date])
            
        # Filter by settlement status
        is_settled = self.request.query_params.get('is_settled')
        if is_settled is not None:
            is_settled = is_settled.lower() == 'true'
            if is_settled:
                queryset = queryset.filter(paid__gte=F('amount'))
            else:
                queryset = queryset.filter(paid__lt=F('amount'))
                
        return queryset


@extend_schema_view(
    create=extend_schema(
        summary="Create ARAP payment",
        description="Create a payment transaction for an ARAP transaction record.",
        request=ARAPPaymentSerializer,
        responses={201: ARAPTransactionSerializer},
        tags=["ARAP Payments"]
    )
)
class ARAPPaymentViewSet(viewsets.GenericViewSet):
    """
    ViewSet for handling payment operations on ARAP transaction records.
    Provides functionality to create payments and view payment history.
    """
    queryset = ARAPTransaction.objects.all()
    serializer_class = ARAPPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request):
        """
        Create a payment for an ARAP transaction record.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment_transaction = serializer.save()
        
        # Return the updated ARAP transaction record
        arap_transaction_id = request.data.get('arap_transaction_id')
        arap_transaction = ARAPTransaction.objects.get(id=arap_transaction_id)
        return Response(ARAPTransactionSerializer(arap_transaction).data, status=status.HTTP_201_CREATED)
    
    @extend_schema(
        summary="Get payment history",
        description="Get payment history for a specific ARAP transaction record.",
        parameters=[
            OpenApiParameter(
                name="arap_transaction_id",
                description="ARAP transaction ID",
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
        Get payment history for a specific ARAP transaction record.
        """
        arap_transaction_id = request.query_params.get('arap_transaction_id')
        if not arap_transaction_id:
            return Response(
                {"error": "arap_transaction_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            arap_transaction = ARAPTransaction.objects.get(id=arap_transaction_id)
        except ARAPTransaction.DoesNotExist:
            return Response(
                {"error": "ARAP transaction record not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Get the parent ARAP record to determine payment type
        arap = arap_transaction.arap
        
        # Get all payment transactions for this ARAP transaction
        transaction_type = TransactionType.RECEIPT if arap.is_receivable else TransactionType.PAYMENT
        payments = TransactionHistory.objects.filter(
            th_type=transaction_type,
            th_note__icontains=f"transaction #{arap_transaction_id}"
        ).order_by('-th_date')
        
        return Response(TransactionHistorySerializer(payments, many=True).data)