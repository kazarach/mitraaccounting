from rest_framework import serializers
from ..models import Bank, Account

class AccountMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for Account model to be used in Bank serializers.
    """
    class Meta:
        model = Account
        fields = ['id', 'name']  # Assuming Account has a name field


class BankSerializer(serializers.ModelSerializer):
    """
    Serializer for the Bank model with expanded account representation.
    """
    acc = AccountMinimalSerializer(read_only=True)
    
    class Meta:
        model = Bank
        fields = ['id', 'code', 'name', 'type', 'cb', 'active', 'acc']


class BankCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating Bank instances.
    """
    class Meta:
        model = Bank
        fields = ['code', 'name', 'type', 'cb', 'active', 'acc']
        
    def validate_code(self, value):
        """
        Validate that the bank code is unique.
        """
        instance = getattr(self, 'instance', None)
        if instance and instance.code == value:
            return value
            
        if Bank.objects.filter(code=value).exists():
            raise serializers.ValidationError("A bank with this code already exists.")
        return value