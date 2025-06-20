import random
from decimal import Decimal
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction as db_transaction
from django.utils import timezone

from api.models.arap import ARAP, ARAPTransaction
from api.models.transaction_history import TransactionHistory, TransactionType
from api.models.customer import Customer
from api.models.supplier import Supplier


class Command(BaseCommand):
    help = 'Seed ARAP and ARAPTransaction records based on TransactionHistory data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding ARAP data from TransactionHistory...")
        try:
            with db_transaction.atomic():
                # Clear previous test ARAP data
                ARAPTransaction.objects.all().delete()
                ARAP.objects.all().delete()

                # Track existing ARAPs
                arap_map = {}  # Keyed by (customer_id, is_receivable) or (supplier_id, is_receivable)

                # Filter transactions that should create ARAPs
                eligible_transactions = TransactionHistory.objects.filter(
                    th_type__in=[
                        TransactionType.SALE,
                        TransactionType.PURCHASE,
                        TransactionType.RETURN_SALE,
                        TransactionType.RETURN_PURCHASE,
                        TransactionType.EXPENSE
                    ]
                ).exclude(th_total=0)

                for transaction in eligible_transactions:
                    is_receivable = transaction.th_type in [
                        TransactionType.SALE,
                        TransactionType.RETURN_PURCHASE
                    ]

                    # Use customer or supplier depending on is_receivable
                    party = transaction.customer if is_receivable else transaction.supplier
                    if not party:
                        continue  # Skip if missing key entity

                    key = (party.id, is_receivable)

                    if key not in arap_map:
                        arap = ARAP.objects.create(
                            customer=party if is_receivable else None,
                            supplier=party if not is_receivable else None,
                            is_receivable=is_receivable,
                            total_amount=Decimal('0.00'),
                            total_paid=Decimal('0.00')
                        )
                        arap_map[key] = arap
                    else:
                        arap = arap_map[key]

                    # Create ARAPTransaction
                    arap_tx = ARAPTransaction.objects.create(
                        transaction_history=transaction,
                        arap=arap,
                        amount=transaction.th_total,
                        paid=Decimal('0.00'),
                        due_date=transaction.th_date + timedelta(days=random.randint(15, 45))
                    )

                    # Update ARAP total
                    arap.total_amount += arap_tx.amount
                    arap.save()

                self.stdout.write(self.style.SUCCESS(
                    f"Successfully seeded {len(eligible_transactions)} ARAP transactions for {len(arap_map)} ARAP records."
                ))

        except Exception as e:
            import traceback
            self.stdout.write(self.style.ERROR(f"Error occurred: {str(e)}"))
            self.stdout.write(self.style.ERROR(traceback.format_exc()))
