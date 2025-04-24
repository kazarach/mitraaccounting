import random
from decimal import Decimal
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
        
        suppliers_to_create = []
        platforms = ['Online', 'Retail', 'Wholesale', 'Distributor', None]
        discount_types = ['Percentage', 'Fixed Amount', None]

        parent_suppliers = []

        # Step 1: Create root suppliers (no parent)
        for _ in range(10):
            supplier = Supplier(
                code=f"SUP-{fake.unique.random_number(digits=4)}",
                name=fake.company(),
                address=fake.address(),
                phone=fake.phone_number(),
                contact_person=fake.name(),
                npwp=f"{fake.random_number(digits=15)}" if random.random() > 0.3 else None,
                platform=random.choice(platforms),
                credit_term_days=random.choice([30, 45, 60, 90]),
                discount=Decimal(f"{random.uniform(0, 20):.2f}") if random.random() > 0.5 else None,
                discount_type=random.choice(discount_types),
                due_days=random.choice([30, 45, 60, 90]) if random.random() > 0.3 else None,
                is_active=random.random() > 0.1,
                parent=None
            )
            supplier.save()  # Save immediately to allow referencing as parent
            parent_suppliers.append(supplier)

        # Step 2: Create child suppliers (with random parents)
        for _ in range(10):
            supplier = Supplier(
                code=f"SUP-{fake.unique.random_number(digits=4)}",
                name=fake.company(),
                address=fake.address(),
                phone=fake.phone_number(),
                contact_person=fake.name(),
                npwp=f"{fake.random_number(digits=15)}" if random.random() > 0.3 else None,
                platform=random.choice(platforms),
                credit_term_days=random.choice([30, 45, 60, 90]),
                discount=Decimal(f"{random.uniform(0, 20):.2f}") if random.random() > 0.5 else None,
                discount_type=random.choice(discount_types),
                due_days=random.choice([30, 45, 60, 90]) if random.random() > 0.3 else None,
                is_active=random.random() > 0.1,
                parent=random.choice(parent_suppliers)
            )
            suppliers_to_create.append(supplier)

        # Step 3: Bulk create child suppliers
        try:
            with transaction.atomic():
                for supplier in suppliers_to_create:
                    supplier.save()
                self.stdout.write(self.style.SUCCESS('Successfully seeded supplier data with parent-child relationships'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding supplier data: {str(e)}'))
