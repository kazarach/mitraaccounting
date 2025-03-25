import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model  # Use this instead of importing User directly
from faker import Faker
from decimal import Decimal
from django.utils import timezone

from api.models.payment_record import PR, PRReturn, PRHistory
from api.models.transaction_history import TransactionHistory
from api.models.bank import Bank

class Command(BaseCommand):
    help = 'Seed Payment Record data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Ensure related models have some data to reference
        self.ensure_related_models_exist()
        
        # Clear existing data
        PRHistory.objects.all().delete()
        PRReturn.objects.all().delete()
        PR.objects.all().delete()
        
        # Generate data
        try:
            with transaction.atomic():
                # Create Payment Records
                payment_records = self.create_payment_records(fake)
                
                # Create Payment Record Returns
                payment_record_returns = self.create_payment_record_returns(fake, payment_records)
                
                # Create Payment Record Histories
                self.create_payment_record_histories(fake, payment_records)
                
                self.stdout.write(self.style.SUCCESS('Successfully seeded Payment Record data'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding Payment Record data: {str(e)}'))

    def ensure_related_models_exist(self):
        """
        Ensure we have some related model instances to reference
        """
        User = get_user_model()  # Retrieve custom User model dynamically

        # Ensure there are some users
        if not User.objects.exists():
            User.objects.create_user(username='admin', password='adminpass')
        
        # Ensure there are some transaction histories
        if not TransactionHistory.objects.exists():
            TransactionHistory.objects.create(
                th_number=f'TH-{random.randint(1000, 9999)}',
                th_total=Decimal(random.uniform(100, 10000))
            )
        
        # Ensure there are some banks
        if not Bank.objects.exists():
            Bank.objects.create(
                bank_name='Sample Bank',
                bank_code='SMP'
            )

    def create_payment_records(self, fake):
        """
        Create Payment Records
        """
        payment_records = []
        transaction_histories = list(TransactionHistory.objects.all())
        
        for _ in range(20):  # Create 20 Payment Records
            th = random.choice(transaction_histories)
            pr_type = random.choice([
                'Cash', 'Transfer', 'Credit', 'Debit', 'Online Payment'
            ])
            
            pr = PR.objects.create(
                th=th,
                pr_type=pr_type
            )
            payment_records.append(pr)
        
        return payment_records

    def create_payment_record_returns(self, fake, payment_records):
        """
        Create Payment Record Returns
        """
        payment_record_returns = []
        transaction_histories = list(TransactionHistory.objects.all())
        
        for _ in range(10):  # Create 10 Payment Record Returns
            th = random.choice(transaction_histories)
            prr = PRReturn.objects.create(
                retur_id=random.randint(1000, 9999) if random.random() > 0.5 else None,
                th=th,
                prr_total=Decimal(random.uniform(50, 5000)),
                prr_from=fake.company() if random.random() > 0.5 else None
            )
            payment_record_returns.append(prr)
        
        return payment_record_returns

    def create_payment_record_histories(self, fake, payment_records):
        """
        Create Payment Record Histories
        """
        User = get_user_model()  # Retrieve custom User model dynamically

        users = list(User.objects.all())
        banks = list(Bank.objects.all())
        transaction_histories = list(TransactionHistory.objects.all())
        
        for pr in payment_records:
            # Create multiple history entries for each Payment Record
            num_histories = random.randint(1, 3)
            for _ in range(num_histories):
                PRHistory.objects.create(
                    payment_record=pr,
                    user=random.choice(users),
                    payment_record_history_type=random.choice([
                        'Initial', 'Partial', 'Full', 'Pending'
                    ]),
                    payment_record_history_amount=Decimal(random.uniform(50, 5000)),
                    payment_record_history_date=timezone.now() - timezone.timedelta(
                        days=random.randint(0, 365),
                        hours=random.randint(0, 24),
                        minutes=random.randint(0, 60)
                    ),
                    payment_record_history_payment=random.choice([
                        'Completed', 'Pending', 'Cancelled', 'Refunded'
                    ]),
                    bank=random.choice(banks) if random.random() > 0.5 else None,
                    payment_record_history_note=fake.text(max_nb_chars=200) if random.random() > 0.5 else None,
                    payment_record_history_status=random.choice([
                        'Active', 'Inactive', 'Processed', 'Waiting'
                    ]),
                    transaction_history=random.choice(transaction_histories) if random.random() > 0.5 else None,
                    bank_number=f'{random.randint(1000, 9999)}-{random.randint(10000, 99999)}' if random.random() > 0.5 else None,
                    payment_record_history_note2=fake.text(max_nb_chars=200) if random.random() > 0.5 else None,
                    payment_record_m_id=random.randint(1000, 9999) if random.random() > 0.5 else None,
                    payment_record_mass_id=random.randint(1000, 9999) if random.random() > 0.5 else None
                )
