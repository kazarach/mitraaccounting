import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker
from api.models.event_discount import EventDisc, EventDiscItem
from api.models.stock import Stock

fake = Faker()

class Command(BaseCommand):
    help = "Seed Event Discounts and Items"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Seeding Event Discounts..."))
        
        # Create 10 Event Discounts
        event_discounts = []
        for _ in range(10):
            event = EventDisc.objects.create(
                code=fake.unique.lexify(text='ED??????'),
                name=fake.sentence(nb_words=3),
                date_start=timezone.now().date(),
                date_end=timezone.now().date() + timezone.timedelta(days=random.randint(1, 30)),
                type=random.choice(['percentage', 'fixed']),
            )
            event_discounts.append(event)
        
        self.stdout.write(self.style.SUCCESS(f"Created {len(event_discounts)} Event Discounts"))
        
        # Get available stocks
        stocks = list(Stock.objects.all())
        if not stocks:
            self.stdout.write(self.style.ERROR("No stocks available. Please seed stocks first."))
            return
        
        self.stdout.write(self.style.SUCCESS("Seeding Event Discount Items..."))
        
        # Create Event Discount Items
        for event in event_discounts:
            for _ in range(random.randint(3, 7)):
                stock = random.choice(stocks)
                EventDiscItem.objects.create(
                    ed=event,
                    stock=stock,
                    disc=round(random.uniform(5, 50), 2),
                    disc_type=random.choice(['percentage', 'fixed']),
                    num=random.randint(1, 10),
                    set=random.randint(1, 5),
                    type=random.choice(['bundle', 'limited', 'exclusive']),
                )
        
        self.stdout.write(self.style.SUCCESS("Event Discounts and Items Seeded Successfully!"))
