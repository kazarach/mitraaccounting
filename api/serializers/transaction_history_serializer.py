from rest_framework import serializers
from ..models import TransactionHistory, TransItemDetail, ARAP, TransactionType
from datetime import timedelta, datetime 


class TransItemDetailSerializer(serializers.ModelSerializer):
    unit = serializers.CharField(source='stock.unit.unit_code', read_only=True)
    conversion_unit = serializers.SerializerMethodField()
    class Meta:
        model = TransItemDetail
        fields = [
            'stock',
            'stock_code',
            'stock_name',
            'stock_price_buy',
            'stock_price_order',
            'quantity',
            'conversion_unit',
            'unit',
            'sell_price',
            'disc',
            'disc_percent',
            'disc_percent2',
            'total',
            'netto',
            'stock_note'
        ]
        read_only_fields = ['total', 'netto']
    
    def get_conversion_unit(self, obj):
        stock = obj.stock
        return stock.conversion_path_with_unit(include_base=True)
    
class TransactionTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionType
        fields = ['id', 'code', 'label']

class TransactionHistorySerializer(serializers.ModelSerializer):
    items = TransItemDetailSerializer(many=True)
    supplier_name = serializers.SerializerMethodField()
    customer_name = serializers.StringRelatedField(source='customer', read_only=True)
    cashier_username = serializers.StringRelatedField(source='cashier', read_only=True)
    bank_name = serializers.StringRelatedField(source='bank', read_only=True)
    event_discount_name = serializers.StringRelatedField(source='event_discount', read_only=True)
    th_due_date = serializers.DateTimeField(required=False, allow_null=True)

    from_account_name = serializers.SerializerMethodField()
    from_account_number = serializers.SerializerMethodField()
    to_account_name = serializers.SerializerMethodField()
    to_account_number = serializers.SerializerMethodField()

    class Meta:
        model = TransactionHistory
        fields = '__all__'

    def get_supplier_name(self, obj):
        return obj.supplier.name if obj.supplier else None

    def get_from_account_name(self, obj):
        return obj.from_account.name if obj.from_account else None

    def get_from_account_number(self, obj):
        return obj.from_account.account_number if obj.from_account else None

    def get_to_account_name(self, obj):
        return obj.to_account.name if obj.to_account else None

    def get_to_account_number(self, obj):
        return obj.to_account.account_number if obj.to_account else None
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        transaction = TransactionHistory.objects.create(**validated_data)
        
        total_netto = 0
        for item_data in items_data:
            item_data.pop('transaction', None)  # ✅ hilangkan jika ada
            item = TransItemDetail.objects.create(transaction=transaction, **item_data)
            total_netto += item.netto or 0

        # validated_data['th_total'] = total_netto
        # transaction = TransactionHistory.objects.create(**validated_data)

        transaction.th_total = total_netto
        transaction.save(update_fields=["th_total"])
        
        self._handle_arap(transaction)

        return transaction

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                item_data.pop('transaction', None)
                TransItemDetail.objects.create(transaction=instance, **item_data)
        return instance
    
    def _handle_arap(self, transaction):
        from ..models.arap import ARAP, ARAPTransaction
        from django.db.models import Sum
        from decimal import Decimal
        from datetime import timedelta, time
        from django.utils import timezone

        if not transaction.th_total:
            return

        th_dp = transaction.th_dp or Decimal("0.00")
        total = transaction.th_total
        is_receivable = transaction.th_type == TransactionType.SALE
        is_payable = transaction.th_type == TransactionType.PURCHASE

        if not (is_receivable or is_payable):
            return

        if is_receivable:
            credit_days = transaction.customer.credit_term_days if transaction.customer else 14
            entity_id = transaction.customer.id if transaction.customer else None
            entity_type = 'customer'
        else:
            credit_days = transaction.supplier.credit_term_days if transaction.supplier else 30
            entity_id = transaction.supplier.id if transaction.supplier else None
            entity_type = 'supplier'

        if not entity_id:
            return

        # Handle due date
        th_date = transaction.th_date
        if not isinstance(th_date, datetime):
            th_date = timezone.make_aware(timezone.datetime.combine(th_date, time.min))

        due_date = transaction.th_due_date or (th_date + timedelta(days=credit_days))

        # Create or get ARAP
        arap_filter = {'customer_id': entity_id} if entity_type == 'customer' else {'supplier_id': entity_id}
        arap, _ = ARAP.objects.get_or_create(
            is_receivable=is_receivable,
            **arap_filter,
            defaults={'total_amount': Decimal('0.00'), 'total_paid': Decimal('0.00')}
        )

        # Create or update ARAPTransaction
        arap_transaction, created = ARAPTransaction.objects.get_or_create(
            arap=arap,
            transaction_history=transaction,
            defaults={'amount': total, 'paid': th_dp, 'due_date': due_date}
        )
        if not created:
            arap_transaction.amount = total
            arap_transaction.paid = th_dp
            arap_transaction.due_date = due_date
            arap_transaction.save()

        # Recalculate ARAP totals
        arap.total_amount = arap.transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        arap.total_paid = arap.transactions.aggregate(total=Sum('paid'))['total'] or Decimal('0.00')
        arap.save()

        # Handle payment
        if self._should_create_payment(transaction):
            self._create_payment(transaction, arap_transaction)

    def _should_create_payment(self, transaction):
        from ..models.transaction_history import TransactionType, PaymentType

        if transaction.th_payment_type == PaymentType.CREDIT:
            return False

        payment_creating_types = [
            TransactionType.SALE,
            TransactionType.PURCHASE,
            TransactionType.RETURN_SALE,
            TransactionType.RETURN_PURCHASE,
            TransactionType.EXPENSE
        ]
        return transaction.th_type in payment_creating_types and transaction.th_total > 0

    def _create_payment(self, transaction, arap_transaction):
        from ..models.payment_record import Payment
        from ..models.transaction_history import TransactionType, PaymentType

        payment_type_mapping = {
            TransactionType.SALE: 'INITIAL',
            TransactionType.PURCHASE: 'INITIAL', 
            TransactionType.RETURN_SALE: 'RETURN',
            TransactionType.RETURN_PURCHASE: 'RETURN',
            TransactionType.PAYMENT: 'ADDITIONAL',
            TransactionType.EXPENSE: 'INITIAL',
        }

        payment_method_mapping = {
            PaymentType.BANK: 'BANK_TRANSFER',
            PaymentType.CASH: 'CASH',
            PaymentType.CREDIT: 'CREDIT'
        }

        amount = transaction.th_dp if transaction.th_dp else transaction.th_total

        if transaction.th_type == TransactionType.RETURN_SALE:
            amount = -abs(amount)
        elif transaction.th_type == TransactionType.RETURN_PURCHASE:
            amount = abs(amount)

        existing_payment = Payment.objects.filter(
            transaction=arap_transaction,
            payment_type=payment_type_mapping.get(transaction.th_type, 'INITIAL'),
            amount=amount
        ).first()

        if existing_payment:
            return existing_payment

        customer_name = transaction.customer.name if transaction.customer else "Unknown Customer"
        supplier_name = transaction.supplier.name if transaction.supplier else "Unknown Supplier"
        notes_mapping = {
            TransactionType.SALE: f"Pembayaran oleh {customer_name}",
            TransactionType.PURCHASE: f"Pembayaran kepada {supplier_name}",
            TransactionType.RETURN_SALE: f"Return kepada {customer_name}",
            TransactionType.RETURN_PURCHASE: f"Return oleh {supplier_name}",
            TransactionType.PAYMENT: f"Pembayaran tambahan oleh" + (f" - {customer_name}" if transaction.customer else f" - {supplier_name}" if transaction.supplier else ""),
            TransactionType.EXPENSE: f"Pengeluaran untuk {transaction.th_code}",
        }

        status = 'PENDING' if transaction.th_payment_type == PaymentType.CREDIT else 'COMPLETED'

        payment = Payment.objects.create(
            transaction=arap_transaction,
            arap=arap_transaction.arap,
            supplier=transaction.supplier,
            customer=transaction.customer,
            payment_type=payment_type_mapping.get(transaction.th_type, 'INITIAL'),
            amount=amount,
            payment_method=payment_method_mapping.get(transaction.th_payment_type),
            bank=transaction.bank,
            operator=transaction.cashier,
            payment_date=transaction.th_date,
            notes=notes_mapping.get(transaction.th_type, f"Auto-generated payment record for {transaction.th_code}"),
            status=status
        )
        return payment
