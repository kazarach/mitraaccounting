import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from faker import Faker
from api.models.account import Account, AccountType, JournalEntry
from api.models.transaction_history import TransactionHistory
from django.utils import timezone

class Command(BaseCommand):
    help = 'Seed account and journal entry data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()

        self.stdout.write('Ensuring related models exist...')
        self.ensure_related_models_exist(fake)

        self.stdout.write('Clearing existing Account and JournalEntry data...')
        Account.objects.all().delete()
        JournalEntry.objects.all().delete()

        self.stdout.write('Creating parent accounts...')
        parent_accounts = self.create_parent_accounts(fake)

        self.stdout.write('Creating sub-accounts...')
        self.create_sub_accounts(fake, parent_accounts)

        self.stdout.write('Creating journal entries...')
        self.create_journal_entries(fake)

        self.stdout.write(self.style.SUCCESS('✅ Successfully seeded account and journal entry data'))

    def ensure_related_models_exist(self, fake):
        """Ensure there are some transactions to associate with journal entries."""
        if not TransactionHistory.objects.exists():
            transactions = [
                TransactionHistory(
                    th_code=f'TH-{fake.unique.random_number(digits=5)}',
                    th_type='SALE',
                    th_payment_type='Cash',
                    th_total=Decimal(random.uniform(100, 10000)).quantize(Decimal('0.01')),
                    th_date=timezone.make_aware(fake.date_time_this_year()),
                    th_status=True
                )
                for _ in range(10)
            ]
            TransactionHistory.objects.bulk_create(transactions)

    def create_parent_accounts(self, fake):
        """Create and return a list of parent Account objects."""
        parent_accounts = []
        for _ in range(5):
            parent = Account.objects.create(
                account_number=fake.unique.numerify(text='##########'),
                name=fake.company(),
                description=fake.sentence(),
                account_type=random.choice(AccountType.choices)[0],
                parent_account=None,
                is_active=random.choice([True, False]),
                balance=Decimal(random.uniform(-10000, 50000)).quantize(Decimal('0.01'))
            )
            parent_accounts.append(parent)
        return parent_accounts

    def create_sub_accounts(self, fake, parent_accounts):
        """Create sub-accounts with references to parent accounts."""
        sub_accounts = [
            Account(
                account_number=fake.unique.numerify(text='##########'),
                name=fake.company(),
                description=fake.sentence(),
                account_type=random.choice(AccountType.choices)[0],
                parent_account=random.choice(parent_accounts),
                is_active=random.choice([True, False]),
                balance=Decimal(random.uniform(-10000, 50000)).quantize(Decimal('0.01'))
            )
            for _ in range(15)
        ]
        Account.objects.bulk_create(sub_accounts)

    def create_journal_entries(self, fake):
        """Create journal entries linked to random transactions and accounts."""
        transaction_ids = list(TransactionHistory.objects.values_list('id', flat=True))
        account_ids = list(Account.objects.values_list('id', flat=True))

        journal_entries = [
            JournalEntry(
                transaction_id=random.choice(transaction_ids),
                account_id=random.choice(account_ids),
                description=fake.sentence(),
                debit_amount=Decimal(random.uniform(100, 10000)).quantize(Decimal('0.01')),
                credit_amount=Decimal(random.uniform(100, 10000)).quantize(Decimal('0.01')),
                date=timezone.make_aware(fake.date_time_this_year())
            )
            for _ in range(50)
        ]
        JournalEntry.objects.bulk_create(journal_entries)
