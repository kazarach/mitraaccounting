from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Seed all data for the inventory application'

    def handle(self, *args, **kwargs):
        # List of seeder commands to run in order
        seeders = [
            'seed_user',
            'seed_unit',
            'seed_category',
            'seed_warehouse',
            'seed_rack',
            'seed_supplier',
            'seed_account',
            'seed_bank',
            'seed_customer',
            'seed_log_drawer',
            'seed_member_type',
            'seed_myindex',
            'seed_sales',

            'seed_stock',
            'seed_stock_unit',
            'seed_stock_assembly',

            'seed_transaction_history',
            'seed_transaction_item',
            'seed_transaction_return',
            'seed_payment_record',
            'seed_event_discount',
        ]

        # Run each seeder
        for seeder in seeders:
            self.stdout.write(f'Running {seeder}...')
            try:
                call_command(seeder)
                self.stdout.write(self.style.SUCCESS(f'{seeder} completed successfully'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error running {seeder}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS('All seeders completed!'))