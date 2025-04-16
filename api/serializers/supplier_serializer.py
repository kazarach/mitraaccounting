from rest_framework import serializers
from ..models import Supplier

class SupplierSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying supplier information.
    """
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['id']

class SupplierCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating suppliers.
    """
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['id']
        
    def validate_code(self, value):
        """
        Validate that the supplier code is unique.
        """
        instance = getattr(self, 'instance', None)
        if Supplier.objects.filter(code=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("Supplier with this code already exists.")
        return value