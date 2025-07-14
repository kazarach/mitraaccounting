import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from faker import Faker
from api.models.account import Account, AccountType, JournalEntry
from api.models.transaction_history import TransactionHistory
from django.utils import timezone


class Command(BaseCommand):
    help = 'Seed required core accounts and related models for ARAP functionality'

    CORE_ACCOUNTS = [
        {
            'account_number': '1100',
            'name': 'Cash',
            'account_type': AccountType.ASSET,
            'description': 'Cash account'
        },
        {
            'account_number': '1200',
            'name': 'Bank',
            'account_type': AccountType.ASSET,
            'description': 'Bank account'
        },
        {
            'account_number': '3300',
            'name': 'Accounts Receivable',
            'account_type': AccountType.ASSET,
            'description': 'Receivable from customers'
        },
        {
            'account_number': '4400',
            'name': 'Accounts Payable',
            'account_type': AccountType.LIABILITY,
            'description': 'Payable to suppliers'
        },
        {
            'account_number': '5000',
            'name': 'Sales Revenue',
            'account_type': AccountType.REVENUE,
            'description': 'Revenue from sales'
        },
        {
            'account_number': '9000',
            'name': 'General Expense',
            'account_type': AccountType.EXPENSE,
            'description': 'General company expenses'
        },
    ]

    def handle(self, *args, **kwargs):
        fake = Faker()
        created_count = 0

        # Create or update core accounts
        for acc_data in self.CORE_ACCOUNTS:
            account, created = Account.objects.update_or_create(
                account_number=acc_data['account_number'],
                defaults={
                    'name': acc_data['name'],
                    'account_type': acc_data['account_type'],
                    'description': acc_data['description'],
                    'is_active': True,
                    'parent_account': None,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'✅ Created account: {account.account_number} - {account.name}')
            else:
                self.stdout.write(f'⚠️  Updated/Verified account: {account.account_number} - {account.name}')

        self.stdout.write(self.style.SUCCESS(f'\nDone. {created_count} new accounts created.'))

        # Optionally: Create one child (sub) account for each core account
        self.create_sub_accounts(fake)

        # Seed related models for testing journal entries
        self.ensure_related_models_exist(fake)
        self.create_journal_entries(fake)

    def ensure_related_models_exist(self, fake):
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

    def create_sub_accounts(self, fake):
        """Create sub-accounts for core accounts, and 3 fake bank sub-accounts under Bank (1200)."""
        for parent in Account.objects.filter(account_number__in=[acc['account_number'] for acc in self.CORE_ACCOUNTS]):
            if parent.account_number == '1200':
                # Only create 3 fake bank sub-accounts under Bank
                for bank_name in ['Bank BCA', 'Bank Mandiri', 'Bank BNI']:
                    sub_acc_number = f"{parent.account_number}{random.randint(100,999)}"  # e.g., 1200123
                    if not Account.objects.filter(name=bank_name, parent_account=parent).exists():
                        Account.objects.create(
                            account_number=sub_acc_number,
                            name=bank_name,
                            account_type=parent.account_type,
                            description=f"{bank_name} account under {parent.name}",
                            parent_account=parent,
                            is_active=True,
                            balance=Decimal('0.00')
                        )
                        self.stdout.write(f'🏦 Created bank sub-account: {sub_acc_number} - {bank_name}')
                        
    def create_journal_entries(self, fake):
        transaction_ids = list(TransactionHistory.objects.values_list('id', flat=True))
        account_ids = list(Account.objects.values_list('id', flat=True))

        if not transaction_ids or not account_ids:
            self.stdout.write("⚠️ Skipping journal entries: no transactions or accounts found.")
            return

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
        self.stdout.write(f'📘 Created {len(journal_entries)} journal entries.')
