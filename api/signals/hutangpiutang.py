from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
from datetime import timedelta, time
from django.utils import timezone
from datetime import datetime

from ..models.transaction_history import TransactionHistory, TransactionType, ARAP

@receiver(post_save, sender=TransactionHistory)
def handle_arap(sender, instance, created, **kwargs):
    if not instance.th_total:
        return  # Skip if there's no total

    th_dp = instance.th_dp or Decimal("0.00")
    total = instance.th_total
    is_receivable = instance.th_type == TransactionType.SALE
    is_payable = instance.th_type == TransactionType.PURCHASE

    # Only create or update for SALE or PURCHASE
    if is_receivable or is_payable:
        # Define due dates (can be made dynamic per customer/supplier if needed)
        if is_receivable:
            credit_days = instance.customer.credit_term_days if instance.customer else 14
        else:
            credit_days = instance.supplier.credit_term_days if instance.supplier else 30

        # Ensure th_date is a datetime object (combine with midnight time)
        if isinstance(instance.th_date, datetime):
            th_date_aware = instance.th_date
        else:
            th_date_aware = timezone.make_aware(
                timezone.datetime.combine(instance.th_date, time.min)
            )

        due_date = th_date_aware + timedelta(days=credit_days)

        # Create or update ARAP
        arap, _ = ARAP.objects.update_or_create(
            transaction=instance,
            defaults={
                'is_receivable': is_receivable,
                'total_amount': total,
                'amount_paid': th_dp,
                'due_date': due_date,
                'is_settled': th_dp >= total,
            }
        )
