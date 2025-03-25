from django.core.management.base import BaseCommand
from django.db import transaction

from api.models.unit import Unit

class Command(BaseCommand):
    help = 'Seed unit data for the application'

    def handle(self, *args, **kwargs):
        # Predefined units
        units_data = [
            {'unit_code': 'PCS', 'unit_name': 'Piece'},
            {'unit_code': 'BOX', 'unit_name': 'Box'},
            {'unit_code': 'KG', 'unit_name': 'Kilogram'},
            {'unit_code': 'LTR', 'unit_name': 'Liter'},
            {'unit_code': 'MTR', 'unit_name': 'Meter'},
            {'unit_code': 'SET', 'unit_name': 'Set'},
            {'unit_code': 'PACK', 'unit_name': 'Pack'}
        ]
        
        # Clear existing unit data
        Unit.objects.all().delete()
        
        # Bulk create units
        try:
            with transaction.atomic():
                Unit.objects.bulk_create([
                    Unit(unit_code=unit['unit_code'], unit_name=unit['unit_name'])
                    for unit in units_data
                ])
                self.stdout.write(self.style.SUCCESS('Successfully seeded unit data'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding unit data: {str(e)}'))