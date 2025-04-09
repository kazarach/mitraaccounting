from rest_framework import serializers
from api.models.bank import Bank
from api.models.account import Account

class BankSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bank
        fields = '__all__'  # Or list specific fields if needed

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Optional: Show related account info
        if instance.acc:
            data['account'] = {
                'id': instance.acc.id,
                'name': instance.acc.name,  # assuming Account has `name` field
                'code': instance.acc.code,  # assuming Account has `code` field
            }
        else:
            data['account'] = None
        return data
