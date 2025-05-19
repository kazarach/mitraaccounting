from django.core.management.base import BaseCommand
from django.utils import timezone
from ...models import Customer

class Command(BaseCommand):
    help = 'Check for and process expired points for customers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--customer-id',
            type=int,
            help='Process expired points for a specific customer ID only',
        )

    def handle(self, *args, **options):
        customer_id = options.get('customer_id')
        
        if customer_id:
            try:
                customers = Customer.objects.filter(id=customer_id, active=True)
                if not customers.exists():
                    self.stdout.write(self.style.ERROR(f'Customer with ID {customer_id} not found or not active'))
                    return
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error retrieving customer: {str(e)}'))
                return
        else:
            customers = Customer.objects.filter(active=True)
            
        total_customers = customers.count()
        total_expired = 0
        processed = 0
        
        self.stdout.write(f'Processing expired points for {total_customers} customers...')
        
        for customer in customers:
            try:
                expired = customer.check_expired_points()
                total_expired += expired
                processed += 1
                
                if expired > 0:
                    self.stdout.write(
                        f'Customer {customer.name} (ID: {customer.id}): Expired {expired} points. '
                        f'New balance: {customer.point}'
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error processing customer {customer.name} (ID: {customer.id}): {str(e)}'
                    )
                )
                
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {processed} customers. Total points expired: {total_expired}'
            )
        )