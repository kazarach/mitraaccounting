import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from api.models.sales import Sales  # Update with your actual app name
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed Sales data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()

        # Check if there are existing users to assign salespeople
        users = list(User.objects.filter(is_active=True))
        if not users:
            self.stdout.write(self.style.ERROR('No active users found. Please create users before running this command.'))
            return

        # Clear existing Sales data
        Sales.objects.all().delete()

        # Generate Sales data
        sales_to_create = []

        for _ in range(10):  # Creates 10 fake sales records
            user = random.choice(users)  # Assign a random user
            code = fake.unique.bothify(text='SALES-####')
            name = fake.name()
            phone = fake.phone_number()
            address = fake.address()
            target = round(random.uniform(10000, 50000), 2)  # Random sales target
            note = fake.sentence()
            active = random.choice([True, False])

            sales_to_create.append(
                Sales(
                    user=user,
                    code=code,
                    name=name,
                    phone=phone,
                    address=address,
                    target=target,
                    note=note,
                    active=active
                )
            )

        # Bulk create to improve performance
        try:
            with transaction.atomic():
                Sales.objects.bulk_create(sales_to_create)
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(sales_to_create)} Sales records'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding Sales data: {str(e)}'))
