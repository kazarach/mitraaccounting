import random
from django.core.management.base import BaseCommand
from django.db import transaction as db_transaction
from faker import Faker
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta, date

from api.models.transaction_history import TransactionHistory, TransItemDetail
from api.models.supplier import Supplier
from api.models.customer import Customer
from api.models.bank import Bank
from api.models.event_discount import EventDisc
from api.models.sales import Sales
from api.models.stock import Stock
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Seed transaction history data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()

        # Ensure related models have some data to reference
        self.ensure_related_models_exist()

        # Clear existing transaction history data
        TransactionHistory.objects.all().delete()
        TransItemDetail.objects.all().delete()

        # Set the start and end dates for 2025
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 31)  # Reduced to just January for faster seeding during testing

        # Generate transaction histories for each day in January 2025 (for testing)
        try:
            with db_transaction.atomic():
                # Create transactions first, then add items separately
                self.stdout.write("Creating base transactions...")
                all_transactions = []
                
                current_date = start_date
                while current_date <= end_date:
                    # For each day, create at least 3 transactions
                    for _ in range(3):
                        # Create transaction dict without calculating points yet
                        transaction_data = self.create_transaction_data(fake, current_date)
                        
                        # Skip point calculation during create by setting a temporary value
                        transaction_data['th_point'] = Decimal('0.00')
                        
                        # Use create directly to get a saved instance with a PK
                        transaction = TransactionHistory.objects.create(**transaction_data)
                        all_transactions.append(transaction)
                    
                    current_date += timedelta(days=1)
                
                # Now create transaction items for all transactions
                self.stdout.write("Creating transaction items...")
                for transaction in all_transactions:
                    items_data = self.create_transaction_items_data(transaction)
                    # Bulk create the items for this transaction
                    items = [TransItemDetail(**item_data) for item_data in items_data]
                    TransItemDetail.objects.bulk_create(items)
                
                # Only now set order references
                self.stdout.write("Setting order references...")
                self.set_order_references(all_transactions)
                
                # Finally, update points and totals for all transactions
                self.stdout.write("Calculating transaction points and totals...")
                for transaction in all_transactions:
                    # Now that items are saved, we can safely calculate points
                    points = transaction.calculate_points() or Decimal('0.00')
                    
                    # Calculate total from items
                    total = sum(item.netto for item in transaction.items.all())
                    
                    # Update directly in the database to avoid triggering the model's save logic
                    TransactionHistory.objects.filter(id=transaction.id).update(
                        th_point=points,
                        th_total=total
                    )
                
                self.stdout.write(self.style.SUCCESS('Successfully seeded transaction history data'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding transaction history data: {str(e)}'))
            import traceback
            self.stdout.write(self.style.ERROR(traceback.format_exc()))

    def set_order_references(self, transactions):
        """
        Update transactions with order references as a separate operation
        after all transactions have been created and have primary keys
        """
        # Only 20% of transactions get references
        transactions_to_update = random.sample(
            transactions, 
            k=min(len(transactions) // 5, len(transactions))
        )
        
        for transaction in transactions_to_update:
            # Only set reference if it's a relevant transaction type
            if transaction.th_type in ['SALE', 'PURCHASE', 'RETURN_SALE', 'RETURN_PURCHASE']:
                # Find suitable references (excluding self)
                potential_references = [t for t in transactions if t.id != transaction.id]
                
                if potential_references:
                    reference = random.choice(potential_references)
                    # Use update directly to avoid any save() method issues
                    TransactionHistory.objects.filter(id=transaction.id).update(
                        th_order_reference=reference
                    )

    def ensure_related_models_exist(self):
        """
        Ensure we have some related model instances to reference
        """
        # Ensure we have some users
        User = get_user_model()
        if not User.objects.exists():
            User.objects.create(username='admin', password='admin123')

        # Ensure we have some suppliers
        if not Supplier.objects.exists():
            Supplier.objects.create(name='Tech Suppliers Inc.', code='SUP001')
            Supplier.objects.create(name='Global Traders', code='SUP002')
        
        # Ensure we have some customers
        if not Customer.objects.exists():
            Customer.objects.create(name='John Doe', telp='1234567890')
            Customer.objects.create(name='Jane Smith', telp='0987654321')
        
        # Ensure we have some banks
        if not Bank.objects.exists():
            Bank.objects.create(bank_name='Sample Bank', bank_code='BNK001')
            Bank.objects.create(bank_name='Another Bank', bank_code='BNK002')
        
        # Ensure we have some event discounts
        if not EventDisc.objects.exists():
            EventDisc.objects.create(code='ED001', name='Summer Sale', type='Percentage')
        
        # Ensure we have some sales records
        if not Sales.objects.exists():
            Sales.objects.create(so_number='SO-001')
        
        # Ensure we have some stocks
        if not Stock.objects.exists():
            from django.core.management import call_command
            call_command('seed_stock')

    def create_transaction_data(self, fake, current_date):
        """
        Create a dictionary of transaction data without saving the object
        """
        # Randomly select related models, with some chance of being None
        supplier = random.choice(list(Supplier.objects.all()))
        customer = random.choice(list(Customer.objects.all()))
        
        # Get the User model and filter for users with role level >= 30 (cashiers and above)
        User = get_user_model()
        eligible_cashiers = User.objects.filter(role__level__gte=30)
        
        # If no eligible cashiers are found, log a warning and create one
        if not eligible_cashiers.exists():
            self.stdout.write(self.style.WARNING('No eligible cashiers found (role level >= 30). Creating a default cashier.'))
            from api.models.custom_user import UserRole
            cashier_role, _ = UserRole.objects.get_or_create(name='cashier', defaults={'level': 30})
            default_cashier = User.objects.create_user(
                username='default_cashier',
                password='cashier123',
                role=cashier_role
            )
            cashier = default_cashier
        else:
            # Select a random cashier from eligible users
            cashier = random.choice(list(eligible_cashiers))
            
        bank = random.choice(list(Bank.objects.all()))
        event_discount = random.choice(list(EventDisc.objects.all()) + [None])
        sales_order = random.choice(list(Sales.objects.all()) + [None])

        # Generate transaction types
        transaction_types = ['SALE', 'PURCHASE', 'RETURN_SALE', 'RETURN_PURCHASE', 'USAGE', 
                             'TRANSFER', 'PAYMENT', 'RECEIPT', 'ADJUSTMENT', 'EXPENSE', 
                             'ORDERIN', 'ORDEROUT']
        payment_types = ['CASH', 'BANK', 'CREDIT']

        # Select transaction type
        th_type = random.choice(transaction_types)

        # Generate values
        total = Decimal(random.uniform(100, 10000)).quantize(Decimal('0.01'))
        discount_values = [Decimal(x) for x in [i * 0.5 for i in range(11)]]
        discount = random.choice(discount_values) if random.random() > 0.5 else None
        ppn = 11

        # Create transaction data dictionary
        transaction_data = {
            'supplier': supplier,
            'customer': customer,
            'cashier': cashier,
            'th_type': th_type,
            'th_payment_type': random.choice(payment_types),
            'th_disc': discount,
            'th_ppn': ppn,
            'th_total': total,  # This will be recalculated later
            'th_date': current_date,
            'th_note': fake.sentence() if random.random() > 0.5 else None,
            'th_status': random.random() > 0.1,  # 90% chance of being active
            'bank': bank,
            'event_discount': event_discount,
            'th_so': sales_order,
            'th_delivery': random.random() > 0.5,
            'th_order': random.random() > 0.5,
            # th_code will be auto-generated in the model's save method
            # Order reference will be set later
        }

        return transaction_data

    def create_transaction_items_data(self, transaction, num_items=5):
        """
        Create transaction items data for a given transaction
        """
        items_data = []
        stocks = list(Stock.objects.all())
        
        # Use between 1 and num_items items
        actual_items = random.randint(1, num_items)
        
        for _ in range(actual_items):
            stock = random.choice(stocks)
            quantity = Decimal(random.uniform(1, 10)).quantize(Decimal('0.01'))
            sell_price = (stock.price_buy * Decimal(random.uniform(1.1, 1.5))).quantize(Decimal('0.01'))
            discount_values = [Decimal(x) for x in [i * 0.5 for i in range(11)]]
            discount_percent = random.choice(discount_values) if random.random() > 0.5 else None
            disc_values = [Decimal(x) for x in range(0, 1001, 50)]
            discount = random.choice(disc_values) if random.random() > 0.5 else None
            
            # Calculate netto (needed for total calculation)
            price_after_discount = sell_price
            if discount:
                price_after_discount -= discount
            elif discount_percent:
                price_after_discount -= (sell_price * discount_percent / 100)
            netto = price_after_discount * quantity

            items_data.append({
                'transaction': transaction,
                'stock': stock,
                'stock_code': stock.code,
                'stock_name': stock.name,
                'stock_price_buy': stock.price_buy,
                'quantity': quantity,
                'sell_price': sell_price,
                'disc': discount,
                'disc_percent': discount_percent,
                'disc_percent2': discount_percent,
                'netto': netto
            })

        return items_data