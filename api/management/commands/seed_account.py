import random
from django.core.management.base import BaseCommand
from faker import Faker
from decimal import Decimal
from api.models.account import Account, AccountType  # Adjust import if necessary

class Command(BaseCommand):
    help = 'Seed account data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Clear existing data
        Account.objects.all().delete()
        
        # Create parent accounts and save them first
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
        
        # Create sub-accounts
        accounts_to_create = []
        for _ in range(15):
            parent = random.choice(parent_accounts)
            accounts_to_create.append(Account(
                account_number=fake.unique.numerify(text='##########'),
                name=fake.company(),
                description=fake.sentence(),
                account_type=random.choice(AccountType.choices)[0],
                parent_account=parent,  # Reference saved parent
                is_active=random.choice([True, False]),
                balance=Decimal(random.uniform(-10000, 50000)).quantize(Decimal('0.01'))
            ))

        # Now bulk create the sub-accounts
        Account.objects.bulk_create(accounts_to_create)
        self.stdout.write(self.style.SUCCESS('Successfully seeded account data'))

    def create_account(self, fake, parent):
        return Account(
            account_number=fake.unique.numerify(text='##########'),
            name=fake.company(),
            description=fake.sentence(),
            account_type=random.choice(AccountType.choices)[0],
            parent_account=parent,
            is_active=random.choice([True, False]),
            balance=Decimal(random.uniform(-10000, 50000)).quantize(Decimal('0.01'))
        )