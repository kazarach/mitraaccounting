import random
from django.core.management.base import BaseCommand
from django.db import transaction as db_transaction  # Rename to avoid conflicts
from faker import Faker
from decimal import Decimal
from django.utils import timezone

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
        
        # Generate transaction histories
        transactions_to_create = []
        for _ in range(50):  # Create 50 transaction histories
            transaction = self.create_transaction_history(fake)
            transactions_to_create.append(transaction)
        
        # Bulk create to improve performance
        try:
            with db_transaction.atomic():

                # First create transaction histories
                created_transactions = TransactionHistory.objects.bulk_create(transactions_to_create)
                
                # Then create transaction item details for each transaction
                transaction_items = []
                for transaction in created_transactions:
                    # Create 1-5 transaction items for each transaction
                    num_items = random.randint(1, 5)
                    transaction_items.extend(
                        self.create_transaction_items(transaction, num_items)
                    )
                
                # Bulk create transaction items
                TransItemDetail.objects.bulk_create(transaction_items)
                
                self.stdout.write(self.style.SUCCESS('Successfully seeded transaction history data'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding transaction history data: {str(e)}'))

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
            Customer.objects.create(name='John Doe', phone='1234567890')
            Customer.objects.create(name='Jane Smith', phone='0987654321')
        
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

    def create_transaction_history(self, fake):
        """
        Create a single transaction history with randomized but realistic data
        """
        # Randomly select related models, with some chance of being None
        supplier = random.choice(list(Supplier.objects.all()) + [None])
        customer = random.choice(list(Customer.objects.all()) + [None])
        User = get_user_model()  # Get the correct User model
        cashier = random.choice(list(User.objects.all()) + [None])
        bank = random.choice(list(Bank.objects.all()) + [None])
        event_discount = random.choice(list(EventDisc.objects.all()) + [None])
        sales_order = random.choice(list(Sales.objects.all()) + [None])
        
        # Generate transaction types
        transaction_types = ['Sale', 'Purchase', 'Return', 'Refund']
        payment_types = ['Cash', 'Credit Card', 'Bank Transfer', 'E-Wallet']
        
        # Generate values
        total = Decimal(random.uniform(100, 10000)).quantize(Decimal('0.01'))
        discount = Decimal(random.uniform(0, float(total * Decimal('0.2')))).quantize(Decimal('0.01')) if random.random() > 0.5 else None
        ppn = (total * Decimal('0.1')).quantize(Decimal('0.01')) if random.random() > 0.3 else None
        
        return TransactionHistory(
            supplier=supplier,
            customer=customer,
            cashier=cashier,
            th_number=f'TH-{fake.unique.random_number(digits=5)}',
            th_type=random.choice(transaction_types),
            th_payment_type=random.choice(payment_types),
            th_disc=discount,
            th_ppn=ppn,
            th_round=Decimal(random.uniform(0, 10)).quantize(Decimal('0.01')) if random.random() > 0.7 else None,
            th_total=total,
            th_date=timezone.now() - timezone.timedelta(days=random.randint(0, 365)),
            th_note=fake.sentence() if random.random() > 0.5 else None,
            th_status=random.random() > 0.1,  # 90% chance of being active
            bank=bank,
            event_discount=event_discount,
            th_so=sales_order,
            th_delivery=random.random() > 0.5,
            th_post=random.random() > 0.5,
            th_point=Decimal(random.uniform(0, 100)).quantize(Decimal('0.01')) if random.random() > 0.7 else None,
            th_point_nominal=Decimal(random.uniform(0, 1000)).quantize(Decimal('0.01')) if random.random() > 0.7 else None
        )

    def create_transaction_items(self, transaction, num_items):
        """
        Create transaction items for a given transaction
        """
        transaction_items = []
        stocks = list(Stock.objects.all())
        
        for _ in range(num_items):
            stock = random.choice(stocks)
            quantity = Decimal(random.uniform(1, 10)).quantize(Decimal('0.01'))
            
            transaction_items.append(
                TransItemDetail(
                    transaction=transaction,
                    stock=stock,
                    quantity=quantity,
                    sell_price=stock.price_buy * Decimal(random.uniform(1.1, 1.5)).quantize(Decimal('0.01'))
                )
            )
        
        return transaction_items