from rest_framework import serializers
from ..models import TransactionHistory, TransItemDetail, ARAP


class TransItemDetailSerializer(serializers.ModelSerializer):
    unit = serializers.CharField(source='stock.unit.unit_code', read_only=True)

    class Meta:
        model = TransItemDetail
        fields = [
            'stock',
            'stock_code',
            'stock_name',
            'stock_price_buy',
            'quantity',
            'unit',
            'sell_price',
            'disc',
            'total',
            'netto',
        ]
        read_only_fields = ['total', 'netto']

class TransactionHistorySerializer(serializers.ModelSerializer):
    items = TransItemDetailSerializer(many=True)
    supplier_name = serializers.SerializerMethodField()
    customer_name = serializers.StringRelatedField(source='customer', read_only=True)
    cashier_username = serializers.StringRelatedField(source='cashier', read_only=True)
    bank_name = serializers.StringRelatedField(source='bank', read_only=True)
    event_discount_name = serializers.StringRelatedField(source='event_discount', read_only=True)

    class Meta:
        model = TransactionHistory
        fields = '__all__'

    def get_supplier_name(self, obj):
        if obj.supplier:
            return obj.supplier.name
        return None
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        transaction = TransactionHistory.objects.create(**validated_data)
        
        total_netto = 0
        for item_data in items_data:
            item_data.pop('transaction', None)  # ✅ hilangkan jika ada
            item = TransItemDetail.objects.create(transaction=transaction, **item_data)
            total_netto += item.netto or 0

        transaction.th_total = total_netto
        transaction.save(update_fields=["th_total"])
        return transaction

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                item_data.pop('transaction', None)  # ✅ hilangkan jika ada
                TransItemDetail.objects.create(transaction=instance, **item_data)
        return instance
