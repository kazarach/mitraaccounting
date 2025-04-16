from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiExample
from ..models import Supplier
from ..serializers import SupplierSerializer, SupplierCreateUpdateSerializer

@extend_schema_view(
    list=extend_schema(
        summary="List suppliers",
        description="Get a list of all suppliers with pagination and search capabilities.",
        responses={200: SupplierSerializer(many=True)},
        tags=["Supplier"]
    ),
    retrieve=extend_schema(
        summary="Retrieve supplier",
        description="Get detailed information about a specific supplier.",
        responses={200: SupplierSerializer},
        tags=["Supplier"]
    ),
    create=extend_schema(
        summary="Create supplier",
        description="Create a new supplier.",
        responses={201: SupplierSerializer},
        tags=["Supplier"]
    ),
    update=extend_schema(
        summary="Update supplier",
        description="Update an existing supplier.",
        responses={200: SupplierSerializer},
        tags=["Supplier"]
    ),
    partial_update=extend_schema(
        summary="Partial update supplier",
        description="Update one or more fields of an existing supplier.",
        responses={200: SupplierSerializer},
        tags=["Supplier"]
    ),
    destroy=extend_schema(
        summary="Delete supplier",
        description="Delete an existing supplier.",
        responses={204: None},
        tags=["Supplier"]
    )
)
class SupplierViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling CRUD operations on Suppliers.
    Requires authentication for all operations.
    """
    queryset = Supplier.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'contact_person', 'platform']
    ordering_fields = ['name', 'code', 'due_days']
    ordering = ['name']

    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return SupplierCreateUpdateSerializer
        return SupplierSerializer

    @extend_schema(
        summary="Get active suppliers",
        description="Retrieve all active suppliers.",
        responses={200: SupplierSerializer(many=True)},
        tags=["Supplier"]
    )
    @action(detail=False, methods=['GET'])
    def active(self, request):
        """
        Get all active suppliers.
        """
        active_suppliers = Supplier.objects.filter(is_active=True)
        page = self.paginate_queryset(active_suppliers)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(active_suppliers, many=True)
        return Response(serializer.data)
        
    @extend_schema(
        summary="Toggle supplier status",
        description="Toggle the active status of a supplier.",
        responses={200: SupplierSerializer},
        tags=["Supplier"]
    )
    @action(detail=True, methods=['POST'])
    def toggle_status(self, request, pk=None):
        """
        Toggle the active status of a supplier.
        """
        try:
            supplier = self.get_object()
            supplier.is_active = not supplier.is_active
            supplier.save()
            serializer = self.get_serializer(supplier)
            return Response(serializer.data)
        except Supplier.DoesNotExist:
            return Response(
                {"detail": "Supplier not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )