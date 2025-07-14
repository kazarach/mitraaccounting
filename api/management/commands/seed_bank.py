import random
from django.core.management.base import BaseCommand
from faker import Faker
from api.models.bank import Bank
from api.models.account import Account

class Command(BaseCommand):
    help = 'Seed one Bank for each existing Account (no filtering)'

    BANK_TYPES = ['Saving', 'Current', 'Business']

    def handle(self, *args, **kwargs):
        fake = Faker()
        created_count = 0

        all_accounts = Account.objects.all()

        for acc in all_accounts:
            bank_name = acc.name
            bank_code = fake.unique.bothify(text='BNK####')
            bank_type = random.choice(self.BANK_TYPES)
            swift_code = fake.swift() if random.random() > 0.3 else None
            is_active = random.choice([True, True, False])

            bank, created = Bank.objects.update_or_create(
                acc=acc,
                defaults={
                    'code': bank_code,
                    'name': bank_name,
                    'type': bank_type,
                    'cb': swift_code,
                    'active': is_active,
                }
            )

            if created:
                created_count += 1
                self.stdout.write(f'✅ Created bank for account {acc.account_number} - {acc.name}')
            else:
                self.stdout.write(f'⚠️  Bank already exists or updated for account {acc.account_number} - {acc.name}')

        self.stdout.write(self.style.SUCCESS(f'\nDone. {created_count} new banks created.'))
