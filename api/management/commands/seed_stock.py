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
    help = 'Seed stock data for the application with parent-child relationships'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Ensure related models have some data to reference
        self.ensure_related_models_exist()
        
        # Clear existing stock data
        Stock.objects.all().delete()
        
        try:
            with transaction.atomic():
                # First create parent stocks (boxes, cartons, etc.)
                parent_stocks = []
                for _ in range(20):  # Create 20 parent stock items
                    parent_stocks.append(self.create_stock_item(fake, is_parent=True))
                
                # Bulk create parents first
                Stock.objects.bulk_create(parent_stocks)
                
                # Now create child stocks with references to parents
                child_stocks = []
                for parent in Stock.objects.all():
                    # Create 1-3 child items for each parent
                    for _ in range(random.randint(1, 3)):
                        child_stocks.append(self.create_child_stock(fake, parent))
                
                # Bulk create child stocks
                Stock.objects.bulk_create(child_stocks)
                
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(parent_stocks)} parent stocks and {len(child_stocks)} child stocks'))
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
            Unit.objects.create(unit_name='Carton', unit_code='CTN')
            Unit.objects.create(unit_name='Dozen', unit_code='DOZ')

    def create_stock_item(self, fake, is_parent=False):
        """
        Create a single stock item with randomized but realistic data
        """
        # Randomly select related models, with some chance of being None
        category = random.choice(list(Category.objects.all()) + [None])
        rack = random.choice(list(Rack.objects.all()) + [None])
        supplier = random.choice(list(Supplier.objects.all()) + [None])
        warehouse = random.choice(list(Warehouse.objects.all()) + [None])
        
        # Select unit based on parent/child status
        if is_parent:
            # Parents are usually larger units (boxes, cartons)
            unit_options = Unit.objects.filter(unit_code__in=['BOX', 'CTN', 'DOZ'])
        else:
            # Children are usually smaller units (pieces)
            unit_options = Unit.objects.filter(unit_code='PCS')
        
        unit = random.choice(list(unit_options) if unit_options.exists() else [None])
        
        # Generate realistic numeric values
        hpp = Decimal(random.uniform(10, 1000)).quantize(Decimal('0.01'))
        quantity = Decimal(random.uniform(0, 500)).quantize(Decimal('0.01'))
        min_stock = Decimal(random.uniform(10, 100)).quantize(Decimal('0.01')) if random.random() > 0.3 else None
        max_stock = Decimal(random.uniform(float(quantity), float(quantity * 2))).quantize(Decimal('0.01')) if min_stock is not None else None
        
        # Generate unique code and barcode
        code = f'STOCK-{fake.unique.random_number(digits=5)}'
        barcode = f'{fake.ean13()}'
        
        # Use company() or catch_phrase() instead of product_name()
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
            unit=unit,
            # Parent stocks don't have parent_stock or parent_conversion
            parent_stock=None,
            parent_conversion=None
        )

    def create_child_stock(self, fake, parent_stock):
        """
        Create a child stock item related to a parent stock
        """
        # Create base stock
        child = self.create_stock_item(fake, is_parent=False)
        
        # Set parent relationship
        child.parent_stock = parent_stock
        
        # Generate meaningful name based on parent
        child.name = f"{parent_stock.name} - Single Item"
        
        # Set conversion rate (how many child items in one parent)
        if parent_stock.unit and parent_stock.unit.unit_code == 'BOX':
            # Boxes typically contain 10-50 pieces
            conversion_rate = Decimal(random.randint(10, 50))
        elif parent_stock.unit and parent_stock.unit.unit_code == 'CTN':
            # Cartons typically contain 40-100 pieces
            conversion_rate = Decimal(random.randint(40, 100))
        elif parent_stock.unit and parent_stock.unit.unit_code == 'DOZ':
            # Dozen is always 12
            conversion_rate = Decimal(12)
        else:
            # Default range
            conversion_rate = Decimal(random.randint(5, 30))
        
        child.parent_conversion = conversion_rate
        
        # Make HPP and price proportional to parent
        child.hpp = (parent_stock.hpp / conversion_rate).quantize(Decimal('0.01'))
        child.price_buy = (parent_stock.price_buy / conversion_rate).quantize(Decimal('0.01'))
        
        # Initial child stock might be less than parent × conversion
        # This simulates some items already sold individually
        potential_qty = parent_stock.quantity * conversion_rate
        child.quantity = Decimal(random.uniform(0, float(potential_qty))).quantize(Decimal('0.01'))
        
        return child