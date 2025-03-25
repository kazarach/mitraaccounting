import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from api.models.rack import Rack

class Command(BaseCommand):
    help = 'Seed rack data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Clear existing rack data
        Rack.objects.all().delete()
        
        # Generate racks
        racks_to_create = []
        
        # Create different rack zones
        zones = ['A', 'B', 'C', 'D', 'E']
        
        for zone in zones:
            for i in range(1, random.randint(3, 6)):
                rack_code = f"{zone}{str(i).zfill(2)}"
                rack_name = f"Rack {zone}-{i} ({fake.word().capitalize()} Zone)"
                
                racks_to_create.append(
                    Rack(
                        rack_code=rack_code,
                        rack_name=rack_name
                    )
                )
        
        # Bulk create to improve performance
        try:
            with transaction.atomic():
                Rack.objects.bulk_create(racks_to_create)
                self.stdout.write(self.style.SUCCESS('Successfully seeded rack data'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding rack data: {str(e)}'))