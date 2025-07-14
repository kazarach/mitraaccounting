from rest_framework import serializers
from ..models import Payment, Account

class PaymentSerializer(serializers.ModelSerializer):
    operator_name = serializers.SerializerMethodField()
    transaction_facture = serializers.SerializerMethodField()
    direction = serializers.SerializerMethodField()
    account_used = serializers.SerializerMethodField()
    bank_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ['id', 'operator', 'payment_date', 'transaction', 'arap', 'supplier', 'customer',
          'payment_type', 'original_payment', 'amount', 'payment_method', 'bank', 'bank_reference',
          'notes', 'status', 'transaction_history',
          'operator_name', 'transaction_facture', 'direction', 'account_used', 'bank_name']


    def get_operator_name(self, obj):
        return obj.operator.get_full_name() or obj.operator.username

    def get_transaction_facture(self, obj):
        return getattr(getattr(obj.transaction, 'transaction_history', None), 'th_code', None)

    def get_direction(self, obj):
        return obj.direction

    def get_bank_name(self, obj):
        return obj.bank.name if obj.bank else "Cash"

    def get_account_used(self, obj):
        if obj.bank:
            acc = Account.objects.filter(name__icontains=obj.bank.name).first()
            return acc.name if acc else "Bank"
        return "Cash"
