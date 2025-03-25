import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from api.models.stock import Stock  # Update with your actual app name
from api.models.unit import Unit
from api.models.stock_unit import StockUnit

class Command(BaseCommand):
    help = 'Seed Stock Unit data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()

        # Fetch available stock items and units
        stocks = list(Stock.objects.all())
        units = list(Unit.objects.all())

        if not stocks or not units:
            self.stdout.write(self.style.ERROR('Not enough stock items or units to create stock units.'))
            return

        # Clear existing Stock Unit data
        StockUnit.objects.all().delete()

        # Generate Stock Unit data
        stock_units_to_create = []

        for stock in stocks:
            selected_units = random.sample(units, min(len(units), random.randint(1, 3)))  # Choose 1-3 units per stock
            
            # Ensure a single base unit
            base_unit = selected_units[0]  # First unit as base

            for index, unit in enumerate(selected_units):
                is_base_unit = (unit == base_unit)  # Ensure only one base unit
                conversion = 1 if is_base_unit else round(random.uniform(0.1, 10), 2)

                stock_units_to_create.append(
                    StockUnit(
                        stock=stock,
                        unit=unit,
                        conversion=conversion,
                        is_base_unit=is_base_unit
                    )
                )

        # Bulk create for efficiency
        try:
            with transaction.atomic():
                StockUnit.objects.bulk_create(stock_units_to_create)
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(stock_units_to_create)} Stock Units'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding Stock Unit data: {str(e)}'))
