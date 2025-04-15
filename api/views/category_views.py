from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiExample
from ..models import Category
from ..serializers import CategorySerializer, CategoryCreateUpdateSerializer

@extend_schema_view(
    list=extend_schema(
        summary="List categories",
        description="Get a list of all categories with pagination and search capabilities.",
        responses={200: CategorySerializer(many=True)},
        tags=["Category"]
    ),
    retrieve=extend_schema(
        summary="Retrieve category",
        description="Get detailed information about a specific category.",
        responses={200: CategorySerializer},
        tags=["Category"]
    ),
    create=extend_schema(
        summary="Create category",
        description="Create a new category.",
        responses={201: CategorySerializer},
        tags=["Category"]
    ),
    update=extend_schema(
        summary="Update category",
        description="Update an existing category.",
        responses={200: CategorySerializer},
        tags=["Category"]
    ),
    partial_update=extend_schema(
        summary="Partial update category",
        description="Update one or more fields of an existing category.",
        responses={200: CategorySerializer},
        tags=["Category"]
    ),
    destroy=extend_schema(
        summary="Delete category",
        description="Delete an existing category.",
        responses={204: None},
        tags=["Category"]
    )
)
class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling CRUD operations on Categories.
    Requires authentication for all operations.
    """
    queryset = Category.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return CategoryCreateUpdateSerializer
        return CategorySerializer

    @extend_schema(
        summary="Get root categories",
        description="Retrieve all root-level categories (those without parents).",
        responses={200: CategorySerializer(many=True)},
        tags=["Category"]
    )
    @action(detail=False, methods=['GET'])
    def root_categories(self, request):
        """
        Get all root-level categories (without parents).
        """
        root_categories = Category.objects.filter(parent__isnull=True)
        serializer = self.get_serializer(root_categories, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get category tree",
        description="Retrieve the full tree hierarchy for a specific category.",
        responses={200: CategorySerializer},
        tags=["Category"]
    )
    @action(detail=True, methods=['GET'])
    def get_tree(self, request, pk=None):
        """
        Get the full tree hierarchy for a specific category.
        """
        try:
            category = self.get_object()
            serializer = self.get_serializer(category)
            return Response(serializer.data)
        except Category.DoesNotExist:
            return Response(
                {"detail": "Category not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
