from rest_framework import serializers
from ..models import UserAccount, UserRole

class UserRoleSerializer(serializers.ModelSerializer):
    """
    Serializer for UserRole model
    """
    class Meta:
        model = UserRole
        fields = ['id', 'name']

class UserAccountSerializer(serializers.ModelSerializer):
    """
    Main serializer for UserAccount with role details
    """
    role = UserRoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=UserRole.objects.all(), 
        source='role', 
        write_only=True,
        required=False
    )

    class Meta:
        model = UserAccount
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name', 
            'role', 
            'role_id',
            'is_active',
            'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=UserRole.objects.all(), 
        required=False
    )

    class Meta:
        model = UserAccount
        fields = [
            'username', 
            'email', 
            'first_name', 
            'last_name', 
            'password', 
            'password2', 
            'role_id'
        ]
        extra_kwargs = {
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

    def validate(self, attrs):
        """
        Validate password matching and role assignment
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        
        # If no role specified, use default 'user' role
        if 'role_id' not in attrs:
            attrs['role_id'] = UserRole.objects.get_or_create(name='user')[0]
        
        return attrs

    def create(self, validated_data):
        """
        Create user with validated data
        """
        # Remove password2 before creating user
        validated_data.pop('password2')
        
        # Get or create role if not provided
        role = validated_data.pop('role_id', None)
        
        # Create user with role
        user = UserAccount.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            role=role,
            **validated_data
        )
        return user