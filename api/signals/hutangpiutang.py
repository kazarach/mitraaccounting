from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
from datetime import timedelta, time
from django.utils import timezone
from datetime import datetime
from django.db.models import Sum

from ..models.transaction_history import TransactionHistory, TransactionType
from ..models.arap import ARAP, ARAPTransaction

@receiver(post_save, sender=TransactionHistory)
def handle_arap(sender, instance, created, **kwargs):
    # Only process new transactions
    if not created:
        return
        
    if not instance.th_total:
        return  # Skip if there's no total

    th_dp = instance.th_dp or Decimal("0.00")
    total = instance.th_total
    is_receivable = instance.th_type == TransactionType.SALE
    is_payable = instance.th_type == TransactionType.PURCHASE

    # Only create or update for SALE or PURCHASE
    if is_receivable or is_payable:
        # Define due dates
        if is_receivable:
            credit_days = instance.customer.credit_term_days if instance.customer else 14
            entity_id = instance.customer.id if instance.customer else None
            entity_type = 'customer'
        else:
            credit_days = instance.supplier.credit_term_days if instance.supplier else 30
            entity_id = instance.supplier.id if instance.supplier else None
            entity_type = 'supplier'

        # Return if no entity
        if not entity_id:
            return

        # Ensure th_date is a datetime object
        if isinstance(instance.th_date, datetime):
            th_date_aware = instance.th_date
        else:
            th_date_aware = timezone.make_aware(
                timezone.datetime.combine(instance.th_date, time.min)
            )

        due_date = th_date_aware + timedelta(days=credit_days)

        # Find or create ARAP record for this supplier/customer
        if entity_type == 'supplier':
            arap, created = ARAP.objects.get_or_create(
                supplier_id=entity_id,
                is_receivable=False,
                defaults={
                    'total_amount': Decimal('0.00'),
                    'total_paid': Decimal('0.00')
                }
            )
        else:  # customer
            arap, created = ARAP.objects.get_or_create(
                customer_id=entity_id,
                is_receivable=True,
                defaults={
                    'total_amount': Decimal('0.00'),
                    'total_paid': Decimal('0.00')
                }
            )

        # Check if a transaction for this TransactionHistory already exists
        transaction, created = ARAPTransaction.objects.get_or_create(
            arap=arap,
            transaction_history=instance,  # Add this field to the ARAPTransaction model
            defaults={
                'amount': total,
                'paid': th_dp,
                'due_date': due_date
            }
        )
        
        if not created:
            # Update existing transaction if needed
            transaction.amount = total
            transaction.paid = th_dp
            transaction.due_date = due_date
            transaction.save()
        
        # Update ARAP totals - more efficient approach
        arap.total_amount = arap.transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        arap.total_paid = arap.transactions.aggregate(total=Sum('paid'))['total'] or Decimal('0.00')
        arap.save()
