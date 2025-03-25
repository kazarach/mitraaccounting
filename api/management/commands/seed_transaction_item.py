import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from api.models.supplier import Supplier
from api.models.customer import Customer
from api.models.sales import Sales
from api.models.transaction_item_par import TransItemPar  # Update with the correct app name

class Command(BaseCommand):
    help = 'Seed Transaction Item Par data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()

        # Fetch available suppliers, customers, and sales
        suppliers = list(Supplier.objects.all())
        customers = list(Customer.objects.all())
        sales_reps = list(Sales.objects.all())

        if not suppliers and not customers:
            self.stdout.write(self.style.ERROR('No suppliers or customers found. Seed them first.'))
            return

        # Clear existing data
        TransItemPar.objects.all().delete()

        # Generate Transaction Item Pars
        trans_items_to_create = []

        for _ in range(50):  # Generate 50 records
            supplier = random.choice(suppliers) if random.choice([True, False]) else None
            customer = random.choice(customers) if not supplier else None  # Either supplier or customer
            sales = random.choice(sales_reps) if random.choice([True, False]) else None

            trans_items_to_create.append(
                TransItemPar(
                    supplier=supplier,
                    customer=customer,
                    tpr_number=fake.unique.bothify(text="TPR-#####"),
                    tpr_type=random.choice(['Purchase', 'Sale', 'Return']),
                    tpr_date=fake.date_time_between(start_date="-1y", end_date="now", tzinfo=timezone.get_current_timezone()),
                    tpr_note=fake.text(max_nb_chars=100),
                    tpr_status=random.choice(['Pending', 'Completed', 'Canceled']),
                    tpr_detail=fake.text(max_nb_chars=200),
                    sales=sales,
                    so_id=random.randint(1000, 9999) if random.choice([True, False]) else None
                )
            )

        # Bulk create for efficiency
        try:
            with transaction.atomic():
                TransItemPar.objects.bulk_create(trans_items_to_create)
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(trans_items_to_create)} Transaction Item Pars'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding Transaction Item Pars: {str(e)}'))
