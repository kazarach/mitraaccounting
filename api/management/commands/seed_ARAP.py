import random
from decimal import Decimal
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction as db_transaction

from api.models.arap import ARAP, ARAPTransaction
from api.models.transaction_history import TransactionHistory
from api.models.customer import Customer
from api.models.supplier import Supplier


class Command(BaseCommand):
    help = 'Seed ARAP and ARAPTransaction records based on TransactionHistory data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding ARAP data from TransactionHistory...")

        try:
            with db_transaction.atomic():
                # Clean up old ARAP data
                ARAPTransaction.objects.all().delete()
                ARAP.objects.all().delete()

                # Track created ARAPs by (party_id, is_receivable)
                arap_map = {}

                # Define valid transaction type codes
                RECEIVABLE_CODES = ['SALE', 'RETURN_PURCHASE']
                PAYABLE_CODES = ['PURCHASE', 'RETURN_SALE', 'EXPENSE']
                VALID_CODES = RECEIVABLE_CODES + PAYABLE_CODES

                # Filter relevant transactions
                eligible_transactions = TransactionHistory.objects.filter(
                    th_type__code__in=VALID_CODES
                ).exclude(th_total=0)

                for tx in eligible_transactions:
                    th_type_code = tx.th_type.code
                    is_receivable = th_type_code in RECEIVABLE_CODES
                    party = tx.customer if is_receivable else tx.supplier

                    if not party:
                        continue  # Skip if party is missing

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
                    ARAPTransaction.objects.create(
                        transaction_history=tx,
                        arap=arap,
                        amount=tx.th_total,
                        paid=Decimal('0.00'),
                        due_date=tx.th_date + timedelta(days=random.randint(15, 45))
                    )

                    # Accumulate total
                    arap.total_amount += tx.th_total

                # Update ARAP totals after loop
                ARAP.objects.bulk_update(arap_map.values(), ['total_amount'])

                self.stdout.write(self.style.SUCCESS(
                    f"Successfully seeded {len(eligible_transactions)} ARAPTransactions "
                    f"for {len(arap_map)} ARAP records."
                ))

        except Exception as e:
            import traceback
            self.stdout.write(self.style.ERROR(f"Error occurred: {str(e)}"))
            self.stdout.write(self.style.ERROR(traceback.format_exc()))
