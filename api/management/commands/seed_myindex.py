import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from api.models.my_index import MyIndex

class Command(BaseCommand):
    help = 'Seed MyIndex data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()

        # Clear existing MyIndex data
        MyIndex.objects.all().delete()

        # Generate MyIndex data
        indexes_to_create = []

        for _ in range(10):  # Creates 10 fake records
            mi_name = fake.unique.word().capitalize()
            mi_value = fake.sentence()

            indexes_to_create.append(
                MyIndex(
                    mi_name=mi_name,
                    mi_value=mi_value
                )
            )

        # Bulk create to improve performance
        try:
            with transaction.atomic():
                MyIndex.objects.bulk_create(indexes_to_create)
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(indexes_to_create)} MyIndex records'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding MyIndex data: {str(e)}'))
