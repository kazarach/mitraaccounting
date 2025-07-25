import random
from django.core.management.base import BaseCommand
from django.db import transaction as db_transaction
from faker import Faker
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta, date

from api.models.transaction_history import TransactionHistory, TransItemDetail, TransactionType
from api.models.supplier import Supplier
from api.models.customer import Customer
from api.models.bank import Bank
from api.models.event_discount import EventDisc
from api.models.stock import Stock
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Seed transaction history data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        self.ensure_related_models_exist()

        TransactionHistory.objects.all().delete()
        TransItemDetail.objects.all().delete()

        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 31)

        try:
            with db_transaction.atomic():
                self.stdout.write("Creating base transactions...")
                all_transactions = []
                current_date = start_date
                all_types = list(TransactionType.objects.all())

                while current_date <= end_date:
                    for _ in range(3):
                        transaction_data = self.create_transaction_data(fake, current_date)
                        transaction_data['th_point'] = Decimal('0.00')
                        transaction_data['th_type'] = random.choice(all_types) if all_types else None

                        transaction = TransactionHistory.objects.create(**transaction_data)
                        all_transactions.append(transaction)
                    current_date += timedelta(days=1)

                self.stdout.write("Creating transaction items...")
                for transaction in all_transactions:
                    item_types = [transaction.th_type.code] if transaction.th_type else []
                    items_data = self.create_transaction_items_data(transaction, th_type=item_types)
                    items = [TransItemDetail(**item_data) for item_data in items_data]
                    TransItemDetail.objects.bulk_create(items)

                self.stdout.write("Setting up return and order references...")
                self.set_transaction_references(all_transactions)

                self.stdout.write("Calculating transaction points and totals...")
                for transaction in all_transactions:
                    points = transaction.calculate_points() or Decimal('0.00')
                    total = sum(item.netto for item in transaction.items.all())
                    TransactionHistory.objects.filter(id=transaction.id).update(
                        th_point=points,
                        th_total=total
                    )

                self.stdout.write(self.style.SUCCESS('Successfully seeded transaction history data'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding transaction history data: {str(e)}'))
            import traceback
            self.stdout.write(self.style.ERROR(traceback.format_exc()))

    def set_transaction_references(self, transactions):
        return_candidates = random.sample(transactions, k=min(len(transactions) // 10, len(transactions)))
        order_candidates = random.sample(
            [t for t in transactions if t not in return_candidates],
            k=min(len(transactions) // 5, len(transactions))
        )

        for transaction in return_candidates:
            potential_originals = TransactionHistory.objects.filter(
                id__in=[t.id for t in transactions if t not in return_candidates and t.id != transaction.id],
                th_type__code__in=['SALE', 'PURCHASE']
            )

            if potential_originals.exists():
                original_transaction = random.choice(list(potential_originals))
                code = original_transaction.th_type.code if original_transaction.th_type else None
                return_type_code = 'RETURN_SALE' if code == 'SALE' else 'RETURN_PURCHASE' if code == 'PURCHASE' else None
                if not return_type_code:
                    continue

                return_type_tag = TransactionType.objects.get(code=return_type_code)
                transaction.th_return = True
                transaction.th_return_reference = original_transaction
                transaction.th_type = return_type_tag
                transaction.save()

        for transaction in order_candidates:
            potential_originals = TransactionHistory.objects.filter(
                id__in=[t.id for t in transactions if t not in order_candidates and t.id != transaction.id],
                th_type__code__in=['SALE', 'PURCHASE']
            )

            if potential_originals.exists():
                original_transaction = random.choice(list(potential_originals))
                code = original_transaction.th_type.code if original_transaction.th_type else None
                order_type_code = 'ORDERIN' if code == 'SALE' else 'ORDEROUT' if code == 'PURCHASE' else None
                if not order_type_code:
                    continue

                order_type_tag = TransactionType.objects.get(code=order_type_code)
                transaction.th_order = True
                transaction.th_order_reference = original_transaction
                transaction.th_type = order_type_tag
                transaction.save()

    def ensure_related_models_exist(self):
        User = get_user_model()
        if not User.objects.exists():
            User.objects.create(username='admin', password='admin123')

        if not Supplier.objects.exists():
            Supplier.objects.create(name='Tech Suppliers Inc.', code='SUP001')
            Supplier.objects.create(name='Global Traders', code='SUP002')

        if not Customer.objects.exists():
            Customer.objects.create(name='John Doe', telp='1234567890')
            Customer.objects.create(name='Jane Smith', telp='0987654321')

        if not Bank.objects.exists():
            Bank.objects.create(bank_name='Sample Bank', bank_code='BNK001')
            Bank.objects.create(bank_name='Another Bank', bank_code='BNK002')

        if not EventDisc.objects.exists():
            EventDisc.objects.create(code='ED001', name='Summer Sale', type='Percentage')

        if not Stock.objects.exists():
            from django.core.management import call_command
            call_command('seed_stock')

    def create_transaction_data(self, fake, current_date):
        supplier = random.choice(list(Supplier.objects.all()))
        customer = random.choice(list(Customer.objects.all()))
        User = get_user_model()
        eligible_cashiers = User.objects.filter(role__level__gte=30)

        if not eligible_cashiers.exists():
            self.stdout.write(self.style.WARNING('No eligible cashiers found. Creating default.'))
            from api.models.custom_user import UserRole
            cashier_role, _ = UserRole.objects.get_or_create(name='cashier', defaults={'level': 30})
            default_cashier = User.objects.create_user(
                username='default_cashier',
                password='cashier123',
                role=cashier_role
            )
            cashier = default_cashier
        else:
            cashier = random.choice(list(eligible_cashiers))

        bank = random.choice(list(Bank.objects.all()))
        event_discount = random.choice(list(EventDisc.objects.all()) + [None])
        total = Decimal(random.uniform(100, 10000)).quantize(Decimal('0.01'))
        discount = random.choice([Decimal(i * 0.5) for i in range(11)]) if random.random() > 0.5 else None

        return {
            'supplier': supplier,
            'customer': customer,
            'cashier': cashier,
            'th_payment_type': random.choice(['CASH', 'BANK', 'CREDIT']),
            'th_disc': discount,
            'th_ppn': 11,
            'th_total': total,
            'th_date': current_date,
            'th_note': fake.sentence() if random.random() > 0.5 else None,
            'th_status': random.random() > 0.1,
            'bank': bank,
            'event_discount': event_discount,
            'th_delivery': random.random() > 0.7,
            'th_return': False,
            'th_order': False,
        }

    def create_transaction_items_data(self, transaction, th_type=None, num_items=5):
        items_data = []
        stocks = list(Stock.objects.all())
        actual_items = random.randint(1, num_items)

        th_type = [th_type] if isinstance(th_type, str) else (th_type or [])

        for _ in range(actual_items):
            stock = random.choice(stocks)
            quantity = Decimal(random.uniform(1, 10)).quantize(Decimal('0.01'))

            if any(t in ['RETURN_PURCHASE', 'SALE', 'USAGE', 'TRANSFER', 'EXPENSE'] for t in th_type):
                quantity *= -1
            elif 'ADJUSTMENT' in th_type and random.random() < 0.5:
                quantity *= -1

            sell_price = (stock.price_buy * Decimal(random.uniform(1.1, 1.5))).quantize(Decimal('0.01'))
            price_order = (stock.price_buy * Decimal(random.uniform(0.9, 1.0))).quantize(Decimal('0.01'))
            discount_percent = random.choice([Decimal(i * 0.5) for i in range(11)]) if random.random() > 0.5 else None
            discount = random.choice([Decimal(x) for x in range(0, 1001, 50)]) if random.random() > 0.5 else None

            price_after_discount = sell_price - (discount or (sell_price * discount_percent / 100 if discount_percent else 0))
            netto = price_after_discount * quantity

            items_data.append({
                'transaction': transaction,
                'stock': stock,
                'stock_code': stock.code,
                'stock_name': stock.name,
                'stock_price_buy': stock.price_buy,
                'stock_price_order': price_order,
                'quantity': quantity,
                'sell_price': sell_price,
                'disc': discount,
                'disc_percent': discount_percent,
                'disc_percent2': discount_percent,
                'netto': netto
            })

        return items_data