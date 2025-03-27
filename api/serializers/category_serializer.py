from rest_framework import serializers
from rest_framework_recursive.fields import RecursiveField
from ..models import Category

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model with recursive children
    """
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 
            'name', 
            'code', 
            'parent', 
            'spc_margin', 
            'spc_status', 
            'children'
        ]

    def get_children(self, obj):
        """
        Recursively serialize children categories
        """
        children = obj.children.all()
        serializer = CategorySerializer(children, many=True)
        return serializer.data


class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer specifically for creating and updating categories
    """
    class Meta:
        model = Category
        fields = [
            'id', 
            'name', 
            'code', 
            'parent', 
            'spc_margin', 
            'spc_status'
        ]