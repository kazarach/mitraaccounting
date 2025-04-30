from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiExample, OpenApiParameter
from ..models import Customer
from ..serializers import CustomerSerializer, CustomerCreateSerializer

@extend_schema_view(
    list=extend_schema(
        summary="List customers",
        description="Get a list of all customers with pagination, filtering, and search capabilities.",
        responses={200: CustomerSerializer(many=True)},
        tags=["Customer"]
    ),
    retrieve=extend_schema(
        summary="Retrieve customer",
        description="Get detailed information about a specific customer.",
        responses={200: CustomerSerializer},
        tags=["Customer"]
    ),
    create=extend_schema(
        summary="Create customer",
        description="Create a new customer associated with the current user.",
        responses={201: CustomerSerializer},
        tags=["Customer"]
    ),
    update=extend_schema(
        summary="Update customer",
        description="Update an existing customer's information.",
        responses={200: CustomerSerializer},
        tags=["Customer"]
    ),
    partial_update=extend_schema(
        summary="Partial update customer",
        description="Update one or more fields of an existing customer.",
        responses={200: CustomerSerializer},
        tags=["Customer"]
    ),
    destroy=extend_schema(
        summary="Delete customer",
        description="Delete an existing customer.",
        responses={204: None},
        tags=["Customer"]
    )
)
class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing customer operations
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['active', 'member_type', 'price_category']
    search_fields = ['code', 'name', 'address', 'contact', 'npwp']
    ordering_fields = ['name', 'code', 'customer_date', 'duedate', 'changed']
    ordering = ['name']

    def get_queryset(self):
        """
        Return customers associated with the current user
        """
        return Customer.objects.all()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'create':
            return CustomerCreateSerializer
        return CustomerSerializer

    def create(self, request, *args, **kwargs):
        """
        Create a new customer
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()


    @extend_schema(
        summary="Get active customers",
        description="Retrieve all active customers associated with the current user.",
        responses={200: CustomerSerializer(many=True)},
        tags=["Customer"]
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Return only active customers
        """
        active_customers = self.get_queryset().filter(active=True)
        page = self.paginate_queryset(active_customers)
        
        if page is not None:
            serializer = CustomerSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = CustomerSerializer(active_customers, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Toggle customer active status",
        description="Toggle the active status of a specific customer.",
        responses={200: CustomerSerializer},
        tags=["Customer"]
    )
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Toggle the active status of a customer
        """
        customer = self.get_object()
        customer.active = not customer.active
        customer.save()
        serializer = CustomerSerializer(customer)
        return Response(serializer.data)
        
    @extend_schema(
        summary="Get customers by member type",
        description="Retrieve customers filtered by a specific member type.",
        parameters=[
            OpenApiParameter(
                name="member_type_id",
                description="ID of the member type to filter by",
                required=True,
                type=int
            )
        ],
        responses={
            200: CustomerSerializer(many=True),
            400: {"type": "object", "properties": {"detail": {"type": "string"}}}
        },
        tags=["Customer"]
    )
    @action(detail=False, methods=['get'])
    def by_member_type(self, request):
        """
        Get customers grouped by member type
        """
        member_type_id = request.query_params.get('member_type_id')
        if member_type_id:
            customers = self.get_queryset().filter(member_type_id=member_type_id)
            serializer = CustomerSerializer(customers, many=True)
            return Response(serializer.data)
        return Response({"detail": "Member type ID is required"}, status=status.HTTP_400_BAD_REQUEST)