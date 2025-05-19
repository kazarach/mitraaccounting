from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal
import random
from datetime import datetime, timedelta

from api.models import PointTransaction, PointTransactionType, Customer, TransactionHistory

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with sample point transactions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=100,
            help='Number of point transactions to create (default: 100)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing point transactions before seeding'
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing point transactions...')
            PointTransaction.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Point transactions cleared.'))

        count = options['count']
        self.stdout.write(f'Creating {count} point transactions...')

        # Get existing data
        customers = list(Customer.objects.all())
        transactions = list(TransactionHistory.objects.all())
        users = list(User.objects.all())

        if not customers:
            self.stdout.write(self.style.ERROR('No customers found. Please create customers first.'))
            return

        if not transactions:
            self.stdout.write(self.style.WARNING('No transaction history found. Creating without linked transactions.'))

        if not users:
            self.stdout.write(self.style.ERROR('No users found. Please create users first.'))
            return

        # Track customer balances for realistic balance_after calculations
        customer_balances = {customer.id: Decimal('0.00') for customer in customers}

        created_count = 0
        for i in range(count):
            try:
                customer = random.choice(customers)
                
                # Determine transaction type and points
                transaction_type, points = self._generate_transaction_data()
                
                # Update customer balance
                customer_balances[customer.id] += points
                balance_after = customer_balances[customer.id]
                
                # Ensure balance doesn't go negative for REDEEMED transactions
                if transaction_type == PointTransactionType.REDEEMED and balance_after < 0:
                    # Adjust points to not make balance negative
                    points = customer_balances[customer.id]
                    customer_balances[customer.id] = Decimal('0.00')
                    balance_after = Decimal('0.00')
                    if points <= 0:
                        continue  # Skip this transaction if no points to redeem

                # Generate timestamps (within last 6 months)
                created_at = self._generate_random_datetime()
                expiry_date = self._generate_expiry_date(transaction_type, created_at)

                # Select related transaction if available
                transaction = random.choice(transactions) if transactions and random.choice([True, False]) else None
                
                # For redemption transactions, sometimes link to another transaction
                redemption_transaction = None
                if transaction_type == PointTransactionType.REDEEMED and transactions:
                    redemption_transaction = random.choice(transactions)

                # Generate note
                note = self._generate_note(transaction_type, points)

                # Create point transaction
                point_transaction = PointTransaction.objects.create(
                    customer=customer,
                    transaction=transaction,
                    redemption_transaction=redemption_transaction,
                    points=points,
                    transaction_type=transaction_type,
                    balance_after=balance_after,
                    note=note,
                    created_by=random.choice(users),
                    created_at=created_at,
                    expiry_date=expiry_date
                )

                created_count += 1
                
                # Progress indicator
                if created_count % 20 == 0:
                    self.stdout.write(f'Created {created_count} point transactions...')

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error creating point transaction {i+1}: {str(e)}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} point transactions.'
            )
        )

        # Display summary
        self._display_summary()

    def _generate_transaction_data(self):
        """Generate transaction type and points based on realistic scenarios"""
        # Weighted distribution of transaction types
        type_weights = {
            PointTransactionType.EARNED: 50,    # 50% earned
            PointTransactionType.REDEEMED: 30,  # 30% redeemed
            PointTransactionType.ADJUSTED: 15,  # 15% adjusted
            PointTransactionType.EXPIRED: 5,    # 5% expired
        }
        
        # Choose transaction type
        transaction_type = random.choices(
            list(type_weights.keys()),
            weights=list(type_weights.values())
        )[0]
        
        # Generate points based on type
        if transaction_type == PointTransactionType.EARNED:
            # Earned points: 10-500
            points = Decimal(str(random.randint(10, 500)))
        elif transaction_type == PointTransactionType.REDEEMED:
            # Redeemed points: -10 to -300 (negative)
            points = Decimal(str(-random.randint(10, 300)))
        elif transaction_type == PointTransactionType.ADJUSTED:
            # Adjusted points: can be positive or negative (-100 to 100)
            points = Decimal(str(random.randint(-100, 100)))
        else:  # EXPIRED
            # Expired points: -5 to -50 (negative)
            points = Decimal(str(-random.randint(5, 50)))
        
        return transaction_type, points

    def _generate_random_datetime(self):
        """Generate a random datetime within the last 6 months"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=180)
        
        time_between = end_date - start_date
        days_between = time_between.days
        random_days = random.randrange(days_between)
        
        return start_date + timedelta(days=random_days)

    def _generate_expiry_date(self, transaction_type, created_at):
        """Generate expiry date for earned points"""
        if transaction_type == PointTransactionType.EARNED:
            # Points expire 1-2 years after earning
            expiry_days = random.randint(365, 730)
            return created_at + timedelta(days=expiry_days)
        return None

    def _generate_note(self, transaction_type, points):
        """Generate realistic notes based on transaction type"""
        notes = {
            PointTransactionType.EARNED: [
                "Points earned from purchase",
                "Welcome bonus points",
                "Loyalty program bonus",
                "Referral bonus points",
                "Birthday bonus points",
                "Special promotion points",
                "Survey completion bonus",
                "Social media engagement points"
            ],
            PointTransactionType.REDEEMED: [
                "Redeemed for discount",
                "Redeemed for free product",
                "Redeemed for shipping",
                "Redeemed for special offer",
                "Redeemed for gift card",
                "Redeemed for cashback",
                "Redeemed for loyalty reward"
            ],
            PointTransactionType.ADJUSTED: [
                "Manual adjustment - customer complaint",
                "System error correction",
                "Goodwill gesture",
                "Promotional adjustment",
                "Manager override",
                "Technical issue correction",
                "Account reconciliation"
            ],
            PointTransactionType.EXPIRED: [
                "Points expired - 1 year limit",
                "Points expired - 2 year limit",
                "Automatic expiration",
                "Account inactive - points expired"
            ]
        }
        
        return random.choice(notes[transaction_type])

    def _display_summary(self):
        """Display a summary of created point transactions"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write('POINT TRANSACTIONS SUMMARY')
        self.stdout.write('='*50)
        
        total = PointTransaction.objects.count()
        self.stdout.write(f'Total point transactions: {total}')
        
        # Count by transaction type
        for transaction_type in PointTransactionType.choices:
            count = PointTransaction.objects.filter(transaction_type=transaction_type[0]).count()
            self.stdout.write(f'{transaction_type[1]}: {count}')
        
        # Total points by type
        from django.db.models import Sum
        earned = PointTransaction.objects.filter(
            transaction_type=PointTransactionType.EARNED
        ).aggregate(Sum('points'))['points__sum'] or 0
        
        redeemed = PointTransaction.objects.filter(
            transaction_type=PointTransactionType.REDEEMED
        ).aggregate(Sum('points'))['points__sum'] or 0
        
        self.stdout.write(f'\nTotal points earned: {earned}')
        self.stdout.write(f'Total points redeemed: {abs(redeemed)}')
        self.stdout.write(f'Net points: {earned + redeemed}')
        
        self.stdout.write('='*50)