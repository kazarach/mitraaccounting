import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from faker import Faker
from django.contrib.auth import get_user_model
from api.models.stock import Stock
from api.models.stock_price import PriceCategory, StockPriceHistory

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed StockPriceHistory data'

    def handle(self, *args, **kwargs):
        fake = Faker()

        stocks = list(Stock.objects.all())
        users = list(User.objects.all())
        categories = list(PriceCategory.objects.all())

        if not stocks:
            self.stdout.write(self.style.ERROR('No stocks found. Please seed Stock data first.'))
            return

        StockPriceHistory.objects.all().delete()

        history_to_create = []
        for _ in range(50):  # Create 50 history records
            stock = random.choice(stocks)
            old_price = Decimal(str(round(random.uniform(10, 100), 2)))
            new_price = old_price + Decimal(str(round(random.uniform(-5, 10), 2)))

            history_to_create.append(StockPriceHistory(
                stock=stock,
                price_category=random.choice(categories) if categories else None,
                old_price=old_price,
                new_price=new_price,
                changed_by=random.choice(users) if users else None,
                change_reason=fake.sentence(nb_words=6),
            ))

        StockPriceHistory.objects.bulk_create(history_to_create)
        self.stdout.write(self.style.SUCCESS('Successfully seeded StockPriceHistory data.'))
