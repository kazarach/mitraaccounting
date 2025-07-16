# serializers/account_serializer.py

from rest_framework import serializers
from ..models import Account

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'account_number', 'name', 'account_type', 'parent_account', 'is_active']
