import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from faker import Faker
from api.models.stock_price import PriceCategory, StockPrice
from api.models.stock import Stock

class Command(BaseCommand):
    help = 'Seed stock price data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Check if there are stocks in the database
        if Stock.objects.count() == 0:
            self.stdout.write(self.style.ERROR('No stocks found in database. Please run stock seeder first.'))
            return
            
        try:
            with transaction.atomic():
                # Clear existing stock prices
                StockPrice.objects.all().delete()
                
                self.stdout.write(self.style.SUCCESS('Creating stock prices...'))
                stocks = Stock.objects.all()
                categories = PriceCategory.objects.all()
                
                stock_prices = []
                margin_types = ['percentage', 'fixed']
                today = timezone.now().date()
                
                for stock in stocks:
                    default_category = PriceCategory.objects.get(is_default=True)
                    
                    for category in categories:
                        margin = Decimal(f"{random.uniform(10, 30):.2f}")
                        margin_type = random.choice(margin_types)
                        
                        if category.name == 'Wholesale':
                            margin = Decimal(f"{random.uniform(5, 15):.2f}")
                        elif category.name == 'Premium':
                            margin = Decimal(f"{random.uniform(25, 50):.2f}")
                        elif category.name == 'Sale':
                            margin = Decimal(f"{random.uniform(3, 10):.2f}")
                        elif category.name == 'Membership':
                            margin = Decimal(f"{random.uniform(10, 25):.2f}")
                        
                        # Calculate price_sell
                        if stock.hpp:
                            if margin_type == 'percentage':
                                price_sell = stock.hpp * (1 + (margin / 100))
                            else:
                                price_sell = stock.hpp + margin
                        else:
                            price_sell = Decimal(f"{random.uniform(10, 100):.2f}")
                        
                        start_date = None
                        end_date = None
                        
                        if category.name == 'Sale':
                            start_date = today
                            end_date = today + timedelta(days=random.randint(7, 30))
                        
                        stock_prices.append(StockPrice(
                            stock=stock,
                            price_category=category,
                            margin=margin,
                            margin_type=margin_type,
                            price_sell=price_sell,
                            is_default=(category == default_category),
                            start_date=start_date,
                            end_date=end_date,
                            allow_below_cost=random.random() > 0.9
                        ))

                # Save stock prices in batches to avoid memory issues with very large datasets
                batch_size = 500
                for i in range(0, len(stock_prices), batch_size):
                    batch = stock_prices[i:i+batch_size]
                    StockPrice.objects.bulk_create(batch, ignore_conflicts=True)
                    self.stdout.write(self.style.SUCCESS(f'Created batch of {len(batch)} stock prices'))
                
                self.stdout.write(self.style.SUCCESS(f'Successfully created {len(stock_prices)} stock prices'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding stock price data: {str(e)}'))
