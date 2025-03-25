import random
from django.core.management.base import BaseCommand
from faker import Faker
from decimal import Decimal
from api.models.bank import Bank  # Adjust the import based on your project structure
from api.models.account import Account  # Adjust if necessary

class Command(BaseCommand):
    help = 'Seed bank data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Ensure related accounts exist
        accounts = list(Account.objects.all())
        
        # Clear existing data
        Bank.objects.all().delete()
        
        banks_to_create = []
        for _ in range(10):  # Create 10 bank records
            banks_to_create.append(self.create_bank(fake, accounts))
        
        # Bulk create for efficiency
        Bank.objects.bulk_create(banks_to_create)
        self.stdout.write(self.style.SUCCESS('Successfully seeded bank data'))
    
    def create_bank(self, fake, accounts):
        return Bank(
            code=fake.unique.bothify(text='BNK####'),
            name=fake.company(),
            type=random.choice(['Saving', 'Current', 'Business', None]),
            cb=fake.swift() if random.random() > 0.3 else None,
            active=random.choice([True, False]),
            acc=random.choice(accounts) if accounts else None
        )