from rest_framework import serializers
from ..models import Customer, MemberType, PriceCategory

class MemberTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for MemberType model
    """
    class Meta:
        model = MemberType
        fields = ['id', 'mt_name']  # Assuming MemberType has a name field

class PriceCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for PriceCategory model
    """
    class Meta:
        model = PriceCategory
        fields = ['id', 'name']  # Assuming PriceCategory has a name field

class CustomerSerializer(serializers.ModelSerializer):
    """
    Main serializer for Customer with related entity details
    """
    member_type = MemberTypeSerializer(read_only=True)
    member_type_id = serializers.PrimaryKeyRelatedField(
        queryset=MemberType.objects.all(),
        source='member_type',
        write_only=True,
        required=False
    )
    
    price_category = PriceCategorySerializer(read_only=True)
    price_category_id = serializers.PrimaryKeyRelatedField(
        queryset=PriceCategory.objects.all(),
        source='price_category',
        write_only=True,
        required=False
    )

    class Meta:
        model = Customer
        fields = [
            'id',
            'code',
            'name',
            'address',
            'telp',
            'contact',
            'npwp',
            'price_category',
            'price_category_id',
            'discount',
            'discount_type',
            'due_period',
            'member_type',
            'member_type_id',
            'active',
            'point',
            'customer_date',
            'duedate',
            'changed',
            'credit_term_days',
        ]
        read_only_fields = ['id', 'changed']

class CustomerCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for customer creation
    """
    member_type_id = serializers.PrimaryKeyRelatedField(
        queryset=MemberType.objects.all(),
        required=False,
        write_only=True,
        source='member_type'
    )
    
    price_category_id = serializers.PrimaryKeyRelatedField(
        queryset=PriceCategory.objects.all(),
        required=False,
        write_only=True,
        source='price_category'
    )

    class Meta:
        model = Customer
        fields = [
            'code',
            'name',
            'address',
            'telp',
            'contact',
            'npwp',
            'price_category_id',
            'discount',
            'discount_type',
            'due_period',
            'member_type_id',
            'active',
            'point',
            'customer_date',
            'duedate',
            'credit_term_days'
        ]
        
    def create(self, validated_data):
        customer = Customer.objects.create(**validated_data)
        return customer
