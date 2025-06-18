from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, F, Count
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse

from ..models import Payment
from ..serializers import PaymentSerializer

@extend_schema_view(
    list=extend_schema(
        summary="List Payments",
        description="List all payment records with optional filters by type, transaction, ARAP, and date range.",
        tags=["Payments"],
        responses={200: PaymentSerializer(many=True)},
    ),
    retrieve=extend_schema(
        summary="Retrieve Payment",
        description="Retrieve a specific payment record by ID.",
        tags=["Payments"],
        responses={200: PaymentSerializer},
    ),
    create=extend_schema(
        summary="Create Payment",
        description="Create a new payment record.",
        tags=["Payments"],
        responses={201: PaymentSerializer},
    ),
    update=extend_schema(
        summary="Update Payment",
        description="Update an existing payment record.",
        tags=["Payments"],
        responses={200: PaymentSerializer},
    ),
    partial_update=extend_schema(
        summary="Partially Update Payment",
        description="Update selected fields of an existing payment record.",
        tags=["Payments"],
        responses={200: PaymentSerializer},
    ),
    destroy=extend_schema(
        summary="Delete Payment",
        description="Delete a payment record.",
        tags=["Payments"],
        responses={204: OpenApiResponse(description='No content')},
    ),
)
class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Payment records including create, read, update, delete and custom filters.
    """
    queryset = Payment.objects.select_related('transaction', 'arap', 'original_payment', 'bank', 'recorded_by')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['transaction', 'arap', 'payment_type', 'status', 'recorded_by', 'customer', 'supplier']
    search_fields = ['bank_reference', 'notes']
    ordering_fields = ['payment_date', 'amount']
    ordering = ['-payment_date']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Date range filter
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(payment_date__range=[start_date, end_date])

        return queryset

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

    @extend_schema(
        summary="Payment Summary",
        description="Returns aggregated totals by payment type and status.",
        tags=["Payments", "Summary"],
        responses={
            200: OpenApiResponse(description="Summary of payment totals")
        }
    )
    @action(detail=False, methods=["get"])
    def summary(self, request):
        """
        Returns summary totals grouped by payment_type and status.
        """
        summary = Payment.objects.values('payment_type', 'status').annotate(
            total_amount=Sum('amount'),
            count=Count('id')
        ).order_by('payment_type', 'status')
        return Response(summary)
