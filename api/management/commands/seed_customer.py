import random
from django.core.management.base import BaseCommand
from faker import Faker
from decimal import Decimal
from django.contrib.auth import get_user_model
from api.models.customer import Customer
from api.models.member_type import MemberType

class Command(BaseCommand):
    help = 'Seed customer data'

    def handle(self, *args, **kwargs):
        fake = Faker()
        User = get_user_model()
        
        # Ensure there are users to assign to customers
        if not User.objects.exists():
            self.stdout.write(self.style.ERROR('No users found. Please create at least one user.'))
            return
        
        # Ensure there are member types to assign to customers
        if not MemberType.objects.exists():
            self.stdout.write(self.style.ERROR('No member types found. Please create at least one member type.'))
            return
        
        member_types = list(MemberType.objects.all())
        
        customers_to_create = []
        for _ in range(50):  # Adjust the number of customers as needed
            user = random.choice(User.objects.all())
            member_type = random.choice(member_types) if member_types else None
            
            customers_to_create.append(Customer(
                code=fake.unique.uuid4()[:8].upper(),
                name=fake.name(),
                address=fake.address(),
                telp=fake.phone_number(),
                contact=fake.name(),
                npwp=fake.uuid4()[:10],
                platform=random.choice(['Web', 'Mobile', 'POS', 'Other']),
                discount=Decimal(random.uniform(0, 50)).quantize(Decimal('0.01')) if random.random() > 0.5 else None,
                discount_type=random.choice(['percentage', 'fixed']) if random.random() > 0.5 else None,
                due_period=random.randint(7, 30) if random.random() > 0.5 else None,
                member_type=member_type,
                active=random.choice([True, False]),
                point=Decimal(random.uniform(0, 500)).quantize(Decimal('0.01')),
                customer_date=fake.date_this_decade(),
                duedate=fake.date_this_year() if random.random() > 0.5 else None,
                user=user
            ))

        Customer.objects.bulk_create(customers_to_create)
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(customers_to_create)} customers!'))
