from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Category
from ..serializers import CategorySerializer, CategoryCreateUpdateSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling CRUD operations on Categories
    """
    queryset = Category.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """
        Use different serializers for different actions
        """
        if self.action in ['create', 'update', 'partial_update']:
            return CategoryCreateUpdateSerializer
        return CategorySerializer

    @action(detail=False, methods=['GET'])
    def root_categories(self, request):
        """
        Get all root-level categories (without parents)
        """
        root_categories = Category.objects.filter(parent__isnull=True)
        serializer = self.get_serializer(root_categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['GET'])
    def get_tree(self, request, pk=None):
        """
        Get the full tree hierarchy for a specific category
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