import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
from decimal import Decimal

from api.models.stock import Stock
from api.models.category import Category
from api.models.rack import Rack
from api.models.supplier import Supplier
from api.models.unit import Unit
from api.models.warehouse import Warehouse

class Command(BaseCommand):
    help = 'Seed stock data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Ensure related models have some data to reference
        self.ensure_related_models_exist()
        
        # Clear existing stock data
        Stock.objects.all().delete()
        
        # Generate stocks
        stocks_to_create = []
        for _ in range(50):  # Create 50 stock items
            stocks_to_create.append(self.create_stock_item(fake))
        
        # Bulk create to improve performance
        try:
            with transaction.atomic():
                Stock.objects.bulk_create(stocks_to_create)
                self.stdout.write(self.style.SUCCESS('Successfully seeded stock data'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding stock data: {str(e)}'))

    def ensure_related_models_exist(self):
        """
        Ensure we have some related model instances to reference
        """
        # Create some default categories if none exist
        if not Category.objects.exists():
            Category.objects.create(name='Electronics')
            Category.objects.create(name='Clothing')
            Category.objects.create(name='Office Supplies')
        
        # Create some default racks if none exist
        if not Rack.objects.exists():
            Rack.objects.create(rack_name='Rack A', rack_code='A001')
            Rack.objects.create(rack_name='Rack B', rack_code='B001')
        
        # Create some default suppliers if none exist
        if not Supplier.objects.exists():
            Supplier.objects.create(name='Tech Suppliers Inc.', code='SUP001')
            Supplier.objects.create(name='Global Traders', code='SUP002')
        
        # Create some default warehouses if none exist
        if not Warehouse.objects.exists():
            Warehouse.objects.create(gudang_name='Main Warehouse', gudang_code='WH001')
            Warehouse.objects.create(gudang_name='Secondary Warehouse', gudang_code='WH002')
        
        # Create some default units if none exist
        if not Unit.objects.exists():
            Unit.objects.create(unit_name='Piece', unit_code='PCS')
            Unit.objects.create(unit_name='Box', unit_code='BOX')

    def create_stock_item(self, fake):
        """
        Create a single stock item with randomized but realistic data
        """
        # Randomly select related models, with some chance of being None
        category = random.choice(list(Category.objects.all()) + [None])
        rack = random.choice(list(Rack.objects.all()) + [None])
        supplier = random.choice(list(Supplier.objects.all()) + [None])
        warehouse = random.choice(list(Warehouse.objects.all()) + [None])
        default_unit = random.choice(list(Unit.objects.all()) + [None])
        
        # Generate realistic numeric values
        hpp = Decimal(random.uniform(10, 1000)).quantize(Decimal('0.01'))
        quantity = Decimal(random.uniform(0, 500)).quantize(Decimal('0.01'))
        min_stock = Decimal(random.uniform(10, 100)).quantize(Decimal('0.01')) if random.random() > 0.3 else None
        max_stock = Decimal(random.uniform(float(quantity), float(quantity * 2))).quantize(Decimal('0.01')) if min_stock is not None else None
        
        # Generate unique code and barcode
        code = f'STOCK-{fake.unique.random_number(digits=5)}'
        barcode = f'{fake.ean13()}'
        
        # Use company() or catch() instead of product_name()
        name = f"{fake.catch_phrase()} {fake.word()}"
        
        return Stock(
            code=code,
            barcode=barcode,
            name=name,
            quantity=quantity,
            hpp=hpp,
            price_buy=hpp * Decimal(random.uniform(1.1, 1.5)).quantize(Decimal('0.01')),
            margin=Decimal(random.uniform(10, 50)).quantize(Decimal('0.01')) if random.random() > 0.3 else None,
            min_stock=min_stock,
            max_stock=max_stock,
            supplier=supplier,
            warehouse=warehouse,
            category=category,
            rack=rack,
            is_active=random.random() > 0.1,  # 90% chance of being active
            is_online=random.random() > 0.7,  # 30% chance of being online
            default_unit=default_unit
        )