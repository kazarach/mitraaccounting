import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
from mptt.models import TreeForeignKey

from api.models.category import Category

class Command(BaseCommand):
    help = 'Seed category data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Clear existing category data
        Category.objects.all().delete()
        
        # Generate categories with hierarchical structure
        categories_to_create = []
        
        # Create some root categories
        root_categories = [
            {'name': 'Electronics', 'code': 'ELEC'},
            {'name': 'Clothing', 'code': 'CLOTH'},
            {'name': 'Office Supplies', 'code': 'OFFSUP'},
            {'name': 'Food & Beverage', 'code': 'FNBEV'}
        ]
        
        for root_cat in root_categories:
            root = Category.objects.create(
                name=root_cat['name'], 
                code=root_cat['code'],
                spc_margin=random.uniform(5, 25),
                spc_status=random.random() > 0.1  # 90% chance of being active
            )
            
            # Create subcategories for each root category
            for _ in range(random.randint(3, 6)):
                subcategory = Category.objects.create(
                    name=f"{root_cat['name']} - {fake.word().capitalize()}",
                    code=f"{root_cat['code']}-{fake.unique.random_number(digits=3)}",
                    parent=root,
                    spc_margin=random.uniform(5, 25),
                    spc_status=random.random() > 0.1
                )
                
                # Optional: Create sub-subcategories
                if random.random() > 0.5:
                    Category.objects.create(
                        name=f"{subcategory.name} - {fake.word().capitalize()}",
                        code=f"{subcategory.code}-{fake.unique.random_number(digits=3)}",
                        parent=subcategory,
                        spc_margin=random.uniform(5, 25),
                        spc_status=random.random() > 0.1
                    )
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded category data'))