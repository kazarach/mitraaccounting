from rest_framework import serializers
from ..models import TransactionHistory, TransItemDetail


class TransItemDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransItemDetail
        fields = [
            'id',
            'stock',
            'stock_code',
            'stock_name',
            'stock_price_buy',
            'quantity',
            'sell_price',
        ]


class TransactionHistorySerializer(serializers.ModelSerializer):
    items = TransItemDetailSerializer(many=True, read_only=True)
    supplier_name = serializers.StringRelatedField(source='supplier', read_only=True)
    customer_name = serializers.StringRelatedField(source='customer', read_only=True)
    cashier_username = serializers.StringRelatedField(source='cashier', read_only=True)
    bank_name = serializers.StringRelatedField(source='bank', read_only=True)
    event_discount_name = serializers.StringRelatedField(source='event_discount', read_only=True)

    class Meta:
        model = TransactionHistory
        fields = [
            'id',
            'supplier',
            'supplier_name',
            'customer',
            'customer_name',
            'cashier',
            'cashier_username',
            'th_number',
            'th_type',
            'th_payment_type',
            'th_disc',
            'th_ppn',
            'th_round',
            'th_dp',
            'th_total',
            'th_date',
            'th_note',
            'th_status',
            'bank',
            'bank_name',
            'event_discount',
            'event_discount_name',
            'th_so',
            'th_retur',
            'th_delivery',
            'th_post',
            'th_point',
            'th_point_nominal',
            'created_at',
            'updated_at',
            'items',
        ]
