from rest_framework import serializers
from django.utils import timezone
from ..models import ARAP, ARAPTransaction, TransactionHistory


class ARAPTransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for individual ARAP transaction records
    """
    is_settled = serializers.BooleanField(read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = ARAPTransaction
        fields = [
            'id',
            'amount',
            'paid',
            'due_date',
            'is_settled',
            'remaining_amount',
        ]


class ARAPSerializer(serializers.ModelSerializer):
    """
    Serializer for ARAP (Accounts Receivable/Accounts Payable) model.
    Provides complete representation of ARAP records including calculated fields.
    """
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    is_receivable_display = serializers.SerializerMethodField()
    # remaining_amount = serializers.DecimalField(source='remaining_amount',max_digits=15, decimal_places=2, read_only=True)    
    remaining_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    transactions = ARAPTransactionSerializer(many=True, read_only=True)
    total_arap = serializers.SerializerMethodField()

    class Meta:
        model = ARAP
        fields = [
            'id',
            'supplier',
            'supplier_name',
            'customer',
            'customer_name',
            'is_receivable',
            'is_receivable_display',
            'total_arap',
            'total_amount',
            'total_paid',
            'remaining_amount',
            'is_settled',
            'transactions',
        ]
    
    def get_is_receivable_display(self, obj):
        """Returns human-readable representation of is_receivable field"""
        return "Receivable" if obj.is_receivable else "Payable"
    
    def get_total_arap(self, obj):
        return obj.transactions.count()

class ARAPPaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for processing payments against ARAP transactions.
    Used for creating payment transactions and updating ARAP payment status.
    """
    arap_transaction_id = serializers.IntegerField(write_only=True)
    payment_amount = serializers.DecimalField(max_digits=15, decimal_places=2, write_only=True)
    payment_date = serializers.DateTimeField(write_only=True, required=False)
    payment_note = serializers.CharField(write_only=True, required=False)
    bank_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = TransactionHistory
        fields = [
            'arap_transaction_id', 
            'payment_amount', 
            'payment_date', 
            'payment_note', 
            'bank_id'
        ]
        
    def create(self, validated_data):
        """
        Create a payment transaction and update the associated ARAP transaction record.
        """
        # Extract ARAP related data
        arap_transaction_id = validated_data.pop('arap_transaction_id')
        payment_amount = validated_data.pop('payment_amount')
        payment_date = validated_data.pop('payment_date', None) or timezone.now()
        payment_note = validated_data.pop('payment_note', None)
        bank_id = validated_data.pop('bank_id', None)
        
        # Get the ARAP transaction record
        try:
            arap_transaction = ARAPTransaction.objects.get(id=arap_transaction_id)
        except ARAPTransaction.DoesNotExist:
            raise serializers.ValidationError({"arap_transaction_id": "ARAP transaction record not found"})
        
        # Get the parent ARAP record
        arap = arap_transaction.arap
        
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
            # Determine the right entity (customer or supplier)
            customer = arap.customer if arap.is_receivable else None
            supplier = arap.supplier if not arap.is_receivable else None
            
            # Create payment transaction
            payment_transaction = TransactionHistory.objects.create(
                th_code=th_code,
                th_type=transaction_type,
                th_payment_type="CASH",  # Default, can be adjusted based on your needs
                th_total=payment_amount,
                th_date=payment_date,
                th_note=payment_note or f"Payment for transaction #{arap_transaction.id}",
                bank_id=bank_id,
                customer=customer,
                supplier=supplier,
                th_status=True,
                th_order=True,
            )
            
            # Update the ARAP transaction record
            arap_transaction.paid += payment_amount
            arap_transaction.save()
            
            # Update the parent ARAP record
            arap.total_paid = sum(t.paid for t in arap.transactions.all())
            arap.save()
            
        return payment_transaction


class ARAPSummarySerializer(serializers.Serializer):
    """
    Serializer for summarizing ARAP data by supplier/customer
    """
    entity_id = serializers.IntegerField()
    entity_name = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=15, decimal_places=2)
    remaining = serializers.DecimalField(max_digits=15, decimal_places=2)
    transaction_count = serializers.IntegerField()