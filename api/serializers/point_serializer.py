from rest_framework import serializers
from ..models import PointTransaction, Customer, TransactionHistory

class PointTransactionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    transaction_code = serializers.CharField(source='transaction.th_code', read_only=True)
    redemption_code = serializers.CharField(source='redemption_transaction.th_code', read_only=True, allow_null=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = PointTransaction
        fields = [
            'id', 'customer', 'customer_name', 'transaction', 'transaction_code',
            'redemption_transaction', 'redemption_code', 'points', 'transaction_type',
            'balance_after', 'note', 'created_by', 'created_by_username',
            'created_at', 'updated_at', 'expiry_date'
        ]
        read_only_fields = ['balance_after', 'created_at', 'updated_at']

class PointTransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointTransaction
        fields = ['customer', 'points', 'transaction_type', 'note', 'expiry_date']
    
    def create(self, validated_data):
        # Get the current user from the context
        user = self.context['request'].user
        
        customer = validated_data['customer']
        points = validated_data['points']
        transaction_type = validated_data['transaction_type']
        note = validated_data.get('note', '')
        expiry_date = validated_data.get('expiry_date')
        
        # Update customer's point balance
        customer.point += points
        customer.save(update_fields=['point'])
        
        # Create the point transaction with updated balance
        point_transaction = PointTransaction.objects.create(
            customer=customer,
            points=points,
            transaction_type=transaction_type,
            balance_after=customer.point,
            note=note,
            created_by=user,
            expiry_date=expiry_date
        )
        
        return point_transaction

class CustomerPointSummarySerializer(serializers.ModelSerializer):
    total_points = serializers.DecimalField(source='point', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'code', 'name', 'total_points']
        read_only_fields = fields

class RedeemPointsSerializer(serializers.Serializer):
    transaction_id = serializers.IntegerField()
    points = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def validate_transaction_id(self, value):
        try:
            transaction = TransactionHistory.objects.get(pk=value)
            if not transaction.customer:
                raise serializers.ValidationError("Transaction has no associated customer")
            return value
        except TransactionHistory.DoesNotExist:
            raise serializers.ValidationError("Transaction not found")
    
    def validate(self, data):
        transaction_id = data['transaction_id']
        points = data['points']
        
        transaction = TransactionHistory.objects.get(pk=transaction_id)
        customer = transaction.customer
        
        if customer.point < points:
            raise serializers.ValidationError(
                {"points": f"Customer only has {customer.point} points available"}
            )
        
        if points <= 0:
            raise serializers.ValidationError({"points": "Points must be greater than zero"})
            
        return data