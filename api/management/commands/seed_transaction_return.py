import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
from decimal import Decimal

from api.models.transaction_history import TransactionHistory
from api.models.transaction_return import TransRetur  # Update with correct app name

class Command(BaseCommand):
    help = 'Seed Transaction Returns'

    def handle(self, *args, **kwargs):
        fake = Faker()

        transactions = list(TransactionHistory.objects.all())

        if not transactions:
            self.stdout.write(self.style.ERROR('No transactions found. Seed them first.'))
            return

        # Clear existing data
        TransRetur.objects.all().delete()

        returns_to_create = []

        for _ in range(30):  # Generate 30 returns
            th = random.choice(transactions)
            tr_total = (th.th_total * Decimal(random.uniform(0.2, 1))).quantize(Decimal('0.01'))

            returns_to_create.append(
                TransRetur(
                    th=th,
                    tr_ori_id=th.id,
                    prh_id=random.randint(1000, 9999),
                    tr_total=tr_total
                )
            )

        # Bulk create for efficiency
        try:
            with transaction.atomic():
                TransRetur.objects.bulk_create(returns_to_create)
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(returns_to_create)} Transaction Returns'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding Transaction Returns: {str(e)}'))
