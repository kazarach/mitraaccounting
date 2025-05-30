import random
from django.core.management.base import BaseCommand
from faker import Faker
from decimal import Decimal
from api.models.customer import Customer
from api.models.member_type import MemberType
from api.models.stock_price import PriceCategory

class Command(BaseCommand):
    help = 'Seed customer data'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Ensure there are member types to assign to customers
        if not MemberType.objects.exists():
            self.stdout.write(self.style.ERROR('No member types found. Please create at least one member type.'))
            return
        
        # Ensure there are price categories to assign to customers
        if not PriceCategory.objects.exists():
            self.stdout.write(self.style.ERROR('No price categories found. Please create at least one price category.'))
            return
        
        member_types = list(MemberType.objects.all())
        price_categories = list(PriceCategory.objects.all())

        customers_to_create = []
        for _ in range(50):  # Adjust the number of customers as needed
            member_type = random.choice(member_types) if member_types else None
            price_category = random.choice(price_categories) if price_categories else None
            
            customers_to_create.append(Customer(
                code=fake.unique.uuid4()[:8].upper(),
                name=fake.name(),
                address=fake.address(),
                telp=fake.phone_number(),
                contact=fake.name(),
                npwp=fake.uuid4()[:10],
                discount=Decimal(random.uniform(0, 50)).quantize(Decimal('0.01')) if random.random() > 0.5 else None,
                discount_type=random.choice(['percentage', 'fixed']) if random.random() > 0.5 else None,
                due_period=random.randint(7, 30) if random.random() > 0.5 else None,
                member_type=member_type,
                price_category=price_category,
                active=random.choice([True, False]),
                point=Decimal(random.uniform(0, 500)).quantize(Decimal('0.01')),
                customer_date=fake.date_this_decade(),
                duedate=fake.date_this_year() if random.random() > 0.5 else None,
            ))

        Customer.objects.bulk_create(customers_to_create)
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(customers_to_create)} customers!'))
