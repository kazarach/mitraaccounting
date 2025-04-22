from rest_framework import serializers
from ..models import TransactionHistory, TransItemDetail, ARAP


class TransItemDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransItemDetail
        fields = [
            'transaction',
            'stock',
            'stock_code',
            'stock_name',
            'stock_price_buy',
            'quantity',
            'sell_price',
        ]


class TransactionHistorySerializer(serializers.ModelSerializer):
    items = TransItemDetailSerializer(many=True)
    supplier_name = serializers.StringRelatedField(source='supplier', read_only=True)
    customer_name = serializers.StringRelatedField(source='customer', read_only=True)
    cashier_username = serializers.StringRelatedField(source='cashier', read_only=True)
    bank_name = serializers.StringRelatedField(source='bank', read_only=True)
    event_discount_name = serializers.StringRelatedField(source='event_discount', read_only=True)

    class Meta:
        model = TransactionHistory
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        transaction = TransactionHistory.objects.create(**validated_data)
        for item_data in items_data:
            TransItemDetail.objects.create(transaction=transaction, **item_data)
        return transaction

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            # Optionally delete and recreate items (or handle smarter updates)
            instance.items.all().delete()
            for item_data in items_data:
                TransItemDetail.objects.create(transaction=instance, **item_data)
        return instance
    
class ARAPSerializer(serializers.ModelSerializer):
    transaction_number = serializers.CharField(source='transaction.th_number', read_only=True)
    is_receivable_display = serializers.SerializerMethodField()
    remaining = serializers.DecimalField(source='remaining_amount', max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = ARAP
        fields = [
            'id',
            'transaction',
            'transaction_number',
            'is_receivable',
            'is_receivable_display',
            'total_amount',
            'amount_paid',
            'remaining',
            'due_date',
            'is_settled',
        ]
    
    def get_is_receivable_display(self, obj):
        return "Receivable" if obj.is_receivable else "Payable"