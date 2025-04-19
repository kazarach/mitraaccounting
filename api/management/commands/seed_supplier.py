import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
from api.models.supplier import Supplier

class Command(BaseCommand):
    help = 'Seed supplier data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Clear existing supplier data
        Supplier.objects.all().delete()
        
        # Generate suppliers
        suppliers_to_create = []
        
        # Platforms to choose from
        platforms = ['Online', 'Retail', 'Wholesale', 'Distributor', None]
        
        # Discount types
        discount_types = ['Percentage', 'Fixed Amount', None]
        
        for _ in range(20):
            suppliers_to_create.append(
                Supplier(
                    code=f"SUP-{fake.unique.random_number(digits=4)}",  # Generate unique code
                    name=fake.company(),
                    address=fake.address(),
                    phone=fake.phone_number(),
                    contact_person=fake.name(),
                    npwp=f"{fake.random_number(digits=15)}" if random.random() > 0.3 else None,  # 30% chance of having NPWP
                    platform=random.choice(platforms),  # Randomly choose a platform
                    discount=random.uniform(0, 20) if random.random() > 0.5 else None,  # 50% chance of having discount
                    discount_type=random.choice(discount_types),  # Randomly select discount type
                    due_days=random.choice([30, 45, 60, 90]) if random.random() > 0.3 else None,  # 30% chance of having due_days
                    is_active=random.random() > 0.1  # 90% chance of being active
                )
            )
        
        # Bulk create to improve performance
        try:
            with transaction.atomic():
                Supplier.objects.bulk_create(suppliers_to_create)
                self.stdout.write(self.style.SUCCESS('Successfully seeded supplier data'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding supplier data: {str(e)}'))
