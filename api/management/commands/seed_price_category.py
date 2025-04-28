import random
from django.core.management.base import BaseCommand
from api.models.stock_price import PriceCategory

class Command(BaseCommand):
    help = 'Seed price category data for the application'

    def handle(self, *args, **kwargs):
        try:
            # Clear existing price categories
            PriceCategory.objects.all().delete()
            
            # Create price categories
            self.stdout.write(self.style.SUCCESS('Creating price categories...'))
            price_categories = [
                PriceCategory(
                    name='Retail',
                    description='Default pricing for retail customers',
                    is_default=True
                ),
                PriceCategory(
                    name='Wholesale',
                    description='Discounted pricing for bulk purchases',
                    is_default=False
                ),
                PriceCategory(
                    name='Premium',
                    description='Premium pricing for high-value customers',
                    is_default=False
                ),
                PriceCategory(
                    name='Sale',
                    description='Special promotional pricing',
                    is_default=False
                ),
                PriceCategory(
                    name='Membership',
                    description='Special pricing for members',
                    is_default=False
                )
            ]
            
            PriceCategory.objects.bulk_create(price_categories)
            self.stdout.write(self.style.SUCCESS(f'Successfully created {len(price_categories)} price categories'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding price category data: {str(e)}'))
