from rest_framework import serializers
from django.utils import timezone
from ..models import ARAP, TransactionHistory


class ARAPSerializer(serializers.ModelSerializer):
    """
    Serializer for ARAP (Accounts Receivable/Accounts Payable) model.
    Provides complete representation of ARAP records including calculated fields.
    """
    transaction_number = serializers.CharField(source='transaction.th_code', read_only=True)
    transaction_supplier = serializers.CharField(source='transaction.supplier', read_only=True)
    is_receivable_display = serializers.SerializerMethodField()
    remaining = serializers.DecimalField(source='remaining_amount', max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = ARAP
        fields = [
            'id',
            'transaction',
            'transaction_number',
            'transaction_supplier',
            'is_receivable',
            'is_receivable_display',
            'total_amount',
            'amount_paid',
            'remaining',
            'due_date',
            'is_settled',
        ]
    
    def get_is_receivable_display(self, obj):
        """Returns human-readable representation of is_receivable field"""
        return "Receivable" if obj.is_receivable else "Payable"


class ARAPPaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for processing payments against ARAP records.
    Used for creating payment transactions and updating ARAP payment status.
    """
    arap_id = serializers.IntegerField(write_only=True)
    payment_amount = serializers.DecimalField(max_digits=15, decimal_places=2, write_only=True)
    payment_date = serializers.DateTimeField(write_only=True, required=False)
    payment_note = serializers.CharField(write_only=True, required=False)
    bank_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = TransactionHistory
        fields = [
            'arap_id', 
            'payment_amount', 
            'payment_date', 
            'payment_note', 
            'bank_id'
        ]
        
    def create(self, validated_data):
        """
        Create a payment transaction and update the associated ARAP record.
        """
        # Extract ARAP related data
        arap_id = validated_data.pop('arap_id')
        payment_amount = validated_data.pop('payment_amount')
        payment_date = validated_data.pop('payment_date', None)
        payment_note = validated_data.pop('payment_note', None)
        bank_id = validated_data.pop('bank_id', None)
        
        # Get the ARAP record
        try:
            arap = ARAP.objects.get(id=arap_id)
        except ARAP.DoesNotExist:
            raise serializers.ValidationError({"arap_id": "ARAP record not found"})
        
        # Determine transaction type based on whether it's receivable or payable
        from ..models import TransactionType
        transaction_type = TransactionType.RECEIPT if arap.is_receivable else TransactionType.PAYMENT
        
        # Create a unique transaction number
        import datetime
        prefix = "REC" if arap.is_receivable else "PAY"
        th_code = f"{prefix}-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create the Transaction History record
        from django.db import transaction
        with transaction.atomic():
            # Create payment transaction
            payment_transaction = TransactionHistory.objects.create(
                th_code=th_code,
                th_type=transaction_type,
                th_payment_type="CASH",  # Default, can be adjusted based on your needs
                th_total=payment_amount,
                th_date=payment_date or timezone.now(),
                th_note=payment_note or f"Payment for {arap.transaction.th_code}",
                bank_id=bank_id,
                customer=arap.transaction.customer,
                supplier=arap.transaction.supplier,
                th_status=True,
                th_order=True,
            )
            
            # Update the ARAP record
            arap.amount_paid += payment_amount
            arap.save()  # This will also update is_settled if fully paid
            
        return payment_transaction