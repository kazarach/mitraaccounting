import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from api.models.stock import Stock  # Update with your actual app name
from api.models.unit import Unit
from api.models.stock_assembly import StockAssembly

class Command(BaseCommand):
    help = 'Seed Stock Assembly data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()

        # Fetch available stock items and units
        stocks = list(Stock.objects.all())
        units = list(Unit.objects.all())

        if len(stocks) < 2:
            self.stdout.write(self.style.ERROR('Not enough stock items to create assemblies.'))
            return

        # Clear existing Stock Assembly data
        StockAssembly.objects.all().delete()

        # Generate Stock Assembly data
        assemblies_to_create = []

        for _ in range(10):  # Creates 10 stock assemblies
            parent_stock = random.choice(stocks)
            component_stock = random.choice([s for s in stocks if s.id != parent_stock.id])  # Avoid self-reference
            assembly_price_buy = round(random.uniform(10, 500), 2)
            assembly_amount = round(random.uniform(1, 20), 2)
            unit = random.choice(units) if units else None
            is_manual_price = random.choice([True, False])

            assemblies_to_create.append(
                StockAssembly(
                    parent_stock=parent_stock,
                    component_stock=component_stock,
                    assembly_price_buy=assembly_price_buy,
                    assembly_amount=assembly_amount,
                    unit=unit,
                    is_manual_price=is_manual_price
                )
            )

        # Bulk create for efficiency
        try:
            with transaction.atomic():
                StockAssembly.objects.bulk_create(assemblies_to_create)
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(assemblies_to_create)} Stock Assemblies'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding Stock Assembly data: {str(e)}'))
