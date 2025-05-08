from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from ..models import Bank
from ..serializers import BankSerializer, BankCreateUpdateSerializer

@extend_schema_view(
    list=extend_schema(
        summary="List banks",
        description="Get a list of all banks with pagination, filtering, and search capabilities.",
        parameters=[
            OpenApiParameter(name="active", description="Filter by active status", required=False, type=bool),
            OpenApiParameter(name="type", description="Filter by bank type", required=False, type=str),
            OpenApiParameter(name="search", description="Search in name and code fields", required=False, type=str),
        ],
        responses={200: BankSerializer(many=True)},
        tags=["Bank"]
    ),
    retrieve=extend_schema(
        summary="Retrieve bank",
        description="Get detailed information about a specific bank.",
        responses={200: BankSerializer},
        tags=["Bank"]
    ),
    create=extend_schema(
        summary="Create bank",
        description="Create a new bank.",
        request=BankCreateUpdateSerializer,
        responses={201: BankSerializer},
        tags=["Bank"]
    ),
    update=extend_schema(
        summary="Update bank",
        description="Update an existing bank.",
        request=BankCreateUpdateSerializer,
        responses={200: BankSerializer},
        tags=["Bank"]
    ),
    partial_update=extend_schema(
        summary="Partial update bank",
        description="Update one or more fields of an existing bank.",
        request=BankCreateUpdateSerializer,
        responses={200: BankSerializer},
        tags=["Bank"]
    ),
    destroy=extend_schema(
        summary="Delete bank",
        description="Delete an existing bank.",
        responses={204: None},
        tags=["Bank"]
    )
)
class BankViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling CRUD operations on Banks.
    Requires authentication for all operations.
    """
    queryset = Bank.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['active', 'type', 'cb']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'type']
    ordering = ['name']

    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return BankCreateUpdateSerializer
        return BankSerializer

    @extend_schema(
        summary="Get active banks",
        description="Retrieve all active banks.",
        responses={200: BankSerializer(many=True)},
        tags=["Bank"]
    )
    @action(detail=False, methods=['GET'])
    def active(self, request):
        """
        Get all active banks.
        """
        active_banks = Bank.objects.filter(active=True)
        page = self.paginate_queryset(active_banks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(active_banks, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Toggle bank active status",
        description="Toggle the active status of a specific bank.",
        responses={200: BankSerializer},
        tags=["Bank"]
    )
    @action(detail=True, methods=['POST'])
    def toggle_active(self, request, pk=None):
        """
        Toggle the active status of a bank.
        """
        bank = self.get_object()
        bank.active = not bank.active
        bank.save()
        serializer = self.get_serializer(bank)
        return Response(serializer.data)

    @extend_schema(
        summary="Get banks by type",
        description="Retrieve banks filtered by type.",
        parameters=[
            OpenApiParameter(name="type", description="Bank type to filter by", required=True, type=str),
        ],
        responses={200: BankSerializer(many=True)},
        examples=[
            OpenApiExample(
                'Example',
                value={"type": "commercial"},
                request_only=True,
            )
        ],
        tags=["Bank"]
    )
    @action(detail=False, methods=['GET'])
    def by_type(self, request):
        """
        Get banks filtered by type.
        """
        bank_type = request.query_params.get('type')
        if not bank_type:
            return Response(
                {"detail": "Type parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        banks = Bank.objects.filter(type=bank_type)
        page = self.paginate_queryset(banks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(banks, many=True)
        return Response(serializer.data)