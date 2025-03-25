import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from api.models.warehouse import Warehouse

class Command(BaseCommand):
    help = 'Seed warehouse data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Clear existing warehouse data
        Warehouse.objects.all().delete()
        
        # Generate warehouses
        warehouses_to_create = []
        
        # Predefined warehouse locations
        locations = ['Main', 'Central', 'North', 'South', 'East', 'West']
        
        for location in locations:
            warehouses_to_create.append(
                Warehouse(
                    gudang_name=f"{location} Warehouse",
                    gudang_code=f"WH-{location.upper()}"
                )
            )
        
        # Add a few more random warehouses
        for _ in range(2):
            warehouses_to_create.append(
                Warehouse(
                    gudang_name=f"{fake.city()} Warehouse",
                    gudang_code=f"WH-{fake.unique.random_number(digits=4)}"
                )
            )
        
        # Bulk create to improve performance
        try:
            with transaction.atomic():
                Warehouse.objects.bulk_create(warehouses_to_create)
                self.stdout.write(self.style.SUCCESS('Successfully seeded warehouse data'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding warehouse data: {str(e)}'))