import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
from decimal import Decimal
import uuid

from api.models.category import Category

class Command(BaseCommand):
    help = 'Seed category data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Clear existing category data
        Category.objects.all().delete()
        
        # Generate categories with hierarchical structure
        
        # Create some root categories
        root_categories = [
            {'name': 'Electronics', 'code': 'ELEC'},
            {'name': 'Clothing', 'code': 'CLOTH'},
            {'name': 'Office Supplies', 'code': 'OFFSUP'},
            {'name': 'Food & Beverage', 'code': 'FNBEV'}
        ]
        
        try:
            with transaction.atomic():
                for root_cat in root_categories:
                    root = Category.objects.create(
                        name=root_cat['name'], 
                        code=root_cat['code'],
                        spc_margin=Decimal(random.uniform(5, 25)).quantize(Decimal('0.01')),
                        spc_status=random.random() > 0.1,  # 90% chance of being active
                        spc_online=random.random() > 0.2   # 80% chance of being online
                    )
                    
                    # Create subcategories for each root category
                    for i in range(random.randint(3, 6)):
                        subcat_name = f"{root_cat['name']} - {fake.word().capitalize()} {uuid.uuid4().hex[:4]}"
                        subcat_code = f"{root_cat['code']}-{i+100}"
                        
                        subcategory = Category.objects.create(
                            name=subcat_name,
                            code=subcat_code,
                            parent=root,
                            spc_margin=Decimal(random.uniform(5, 25)).quantize(Decimal('0.01')),
                            spc_status=random.random() > 0.1,
                            spc_online=random.random() > 0.2
                        )
                        
                        # Optional: Create sub-subcategories
                        if random.random() > 0.5:
                            for j in range(random.randint(1, 3)):
                                subsubcat_name = f"{root_cat['name']} - {fake.word().capitalize()} {uuid.uuid4().hex[:4]}"
                                subsubcat_code = f"{subcategory.code}-{j+100}"
                                
                                Category.objects.create(
                                    name=subsubcat_name,
                                    code=subsubcat_code,
                                    parent=subcategory,
                                    spc_margin=Decimal(random.uniform(5, 25)).quantize(Decimal('0.01')),
                                    spc_status=random.random() > 0.1,
                                    spc_online=random.random() > 0.2
                                )
                
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {Category.objects.count()} categories'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding category data: {str(e)}'))