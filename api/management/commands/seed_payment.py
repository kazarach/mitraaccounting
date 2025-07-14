import random
from decimal import Decimal
from faker import Faker
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

from api.models.arap import ARAP, ARAPTransaction
from api.models.payment_record import Payment
from api.models.bank import Bank


class Command(BaseCommand):
    help = 'Seed Payments based on ARAP and ARAPTransactions'

    def handle(self, *args, **kwargs):
        fake = Faker()
        self.ensure_related_models_exist()

        # Clear existing payments
        Payment.objects.all().delete()

        try:
            with transaction.atomic():
                self.stdout.write("Creating payments from ARAP records...")

                araps = ARAP.objects.prefetch_related('transactions').all()
                users = list(get_user_model().objects.all())
                banks = list(Bank.objects.all())
                payment_methods = ['CASH', 'BANK', 'TRANSFER']
                statuses = ['COMPLETED', 'PENDING']

                for arap in araps:
                    for tx in arap.transactions.all():
                        if tx.remaining_amount() <= 0:
                            continue

                        # INITIAL payment (1 per transaction)
                        initial_amount = tx.remaining_amount() * Decimal(random.uniform(0.3, 1)).quantize(Decimal('0.01'))
                        if initial_amount > 0:
                            self.create_payment(
                                arap=arap,
                                transaction=tx,
                                amount=initial_amount,
                                payment_type='INITIAL',
                                payment_method=random.choice(payment_methods),
                                bank=random.choice(banks) if random.random() > 0.5 else None,
                                operator=random.choice(users),
                                notes=f"Initial payment for tx {tx.id}",
                                status=random.choice(statuses),
                                fake=fake
                            )

                        # Additional payments (random 0–2)
                        num_additional = random.randint(0, 2)
                        for _ in range(num_additional):
                            if tx.remaining_amount() <= 0:
                                break
                            add_amount = min(tx.remaining_amount(), Decimal(random.uniform(10, 200)))
                            self.create_payment(
                                arap=arap,
                                transaction=tx,
                                amount=add_amount,
                                payment_type='ADDITIONAL',
                                payment_method=random.choice(payment_methods),
                                bank=random.choice(banks) if random.random() > 0.5 else None,
                                operator=random.choice(users),
                                notes=f"Additional payment for tx {tx.id}",
                                status=random.choice(statuses),
                                fake=fake
                            )

                        # Return payment (random chance)
                        if random.random() < 0.1:
                            returned_amount = tx.paid * Decimal(random.uniform(0.1, 0.5)).quantize(Decimal('0.01'))
                            if returned_amount > 0:
                                Payment.objects.create(
                                    arap=arap,
                                    transaction=tx,
                                    payment_type='RETURN',
                                    amount=returned_amount,
                                    original_payment=None,  # Optional: link to the initial payment
                                    payment_method=random.choice(payment_methods),
                                    bank=random.choice(banks) if random.random() > 0.5 else None,
                                    operator=random.choice(users),
                                    payment_date=timezone.now().date(),
                                    notes=f"Return for tx {tx.id}",
                                    status='COMPLETED'
                                )
                                tx.paid -= returned_amount
                                tx.save()
                                arap.total_paid -= returned_amount
                                arap.save()

                self.stdout.write(self.style.SUCCESS("Successfully seeded payments from ARAPs."))
        except Exception as e:
            import traceback
            self.stdout.write(self.style.ERROR(f"Error: {e}"))
            self.stdout.write(self.style.ERROR(traceback.format_exc()))

    def create_payment(self, arap, transaction, amount, payment_type, payment_method, bank, operator, notes, status, fake):
        """
        Use ARAP.add_payment() to apply the payment to the transaction properly.
        """
        return arap.add_payment(
            transaction=transaction,
            amount=Decimal(amount),
            payment_method=payment_method,
            bank=bank,
            notes=notes,
            operator=operator
        )

    def ensure_related_models_exist(self):
        """
        Ensure required records exist before running
        """
        User = get_user_model()
        if not User.objects.exists():
            User.objects.create_user(username='admin', password='admin123')

        if not Bank.objects.exists():
            Bank.objects.create(bank_name='Default Bank', bank_code='DEF001')

        if not ARAPTransaction.objects.exists():
            raise Exception("No ARAPTransaction records found. Please run `seed_arap_from_transactions` first.")
