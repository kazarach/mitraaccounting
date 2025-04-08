import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from faker import Faker
from decimal import Decimal
from django.utils import timezone

from api.models.payment_record import Payment  # Updated import for the new model
from api.models.transaction_history import TransactionHistory
from api.models.bank import Bank

class Command(BaseCommand):
    help = 'Seed Payment data for the application'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Ensure related models have some data to reference
        self.ensure_related_models_exist()
        
        # Clear existing data
        Payment.objects.all().delete()
        
        # Generate data
        try:
            with transaction.atomic():
                # Create Initial Payments
                initial_payments = self.create_initial_payments(fake)
                
                # Create Additional Payments
                additional_payments = self.create_additional_payments(fake, initial_payments)
                
                # Create Payment Returns
                payment_returns = self.create_payment_returns(fake, initial_payments)
                
                self.stdout.write(self.style.SUCCESS('Successfully seeded Payment data'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding Payment data: {str(e)}'))

    def ensure_related_models_exist(self):
        """
        Ensure we have some related model instances to reference
        """
        User = get_user_model()

        # Ensure there are some users
        if not User.objects.exists():
            User.objects.create_user(username='admin', password='adminpass')
        
        # Ensure there are some transaction histories
        if not TransactionHistory.objects.exists():
            TransactionHistory.objects.create(
                th_number=f'TH-{random.randint(1000, 9999)}',
                th_total=Decimal(random.uniform(100, 10000))
            )
        
        # Ensure there are some banks
        if not Bank.objects.exists():
            Bank.objects.create(
                bank_name='Sample Bank',
                bank_code='SMP'
            )

    def create_initial_payments(self, fake):
        """
        Create Initial Payments
        """
        initial_payments = []
        transaction_histories = list(TransactionHistory.objects.all())
        users = list(get_user_model().objects.all())
        banks = list(Bank.objects.all())
        
        payment_methods = ['Cash', 'Transfer', 'Credit Card', 'Debit Card', 'Online Payment']
        statuses = ['COMPLETED', 'PENDING', 'PROCESSING']
        
        for _ in range(20):  # Create 20 Initial Payments
            th = random.choice(transaction_histories)
            
            payment = Payment.objects.create(
                transaction=th,
                payment_type='INITIAL',
                original_payment=None,
                amount=Decimal(random.uniform(50, 5000)),
                payment_method=random.choice(payment_methods),
                bank=random.choice(banks) if random.random() > 0.5 else None,
                bank_reference=f'{random.randint(1000, 9999)}-{random.randint(10000, 99999)}' if random.random() > 0.5 else None,
                recorded_by=random.choice(users),
                payment_date=timezone.now() - timezone.timedelta(
                    days=random.randint(0, 365),
                    hours=random.randint(0, 24),
                    minutes=random.randint(0, 60)
                ),
                notes=fake.text(max_nb_chars=200) if random.random() > 0.5 else None,
                status=random.choice(statuses),
                reference_id=random.randint(1000, 9999) if random.random() > 0.5 else None
            )
            initial_payments.append(payment)
        
        return initial_payments

    def create_additional_payments(self, fake, initial_payments):
        """
        Create Additional Payments linked to initial payments
        """
        additional_payments = []
        users = list(get_user_model().objects.all())
        banks = list(Bank.objects.all())
        
        payment_methods = ['Cash', 'Transfer', 'Credit Card', 'Debit Card', 'Online Payment']
        statuses = ['COMPLETED', 'PENDING', 'PROCESSING']
        
        # Create additional payments for some of the initial payments
        for payment in random.sample(initial_payments, min(10, len(initial_payments))):
            num_additional = random.randint(1, 3)
            
            for _ in range(num_additional):
                additional_payment = Payment.objects.create(
                    transaction=payment.transaction,
                    payment_type='ADDITIONAL',
                    original_payment=payment,
                    amount=Decimal(random.uniform(10, 1000)),
                    payment_method=random.choice(payment_methods),
                    bank=random.choice(banks) if random.random() > 0.5 else None,
                    bank_reference=f'{random.randint(1000, 9999)}-{random.randint(10000, 99999)}' if random.random() > 0.5 else None,
                    recorded_by=random.choice(users),
                    payment_date=payment.payment_date + timezone.timedelta(
                        days=random.randint(1, 30),
                        hours=random.randint(0, 24),
                        minutes=random.randint(0, 60)
                    ),
                    notes=fake.text(max_nb_chars=200) if random.random() > 0.5 else None,
                    status=random.choice(statuses),
                    reference_id=random.randint(1000, 9999) if random.random() > 0.5 else None
                )
                additional_payments.append(additional_payment)
        
        return additional_payments

    def create_payment_returns(self, fake, initial_payments):
        """
        Create Payment Returns linked to initial payments
        """
        payment_returns = []
        users = list(get_user_model().objects.all())
        banks = list(Bank.objects.all())
        
        # Create returns for some of the initial payments
        for payment in random.sample(initial_payments, min(5, len(initial_payments))):
            return_payment = Payment.objects.create(
                transaction=payment.transaction,
                payment_type='RETURN',
                original_payment=payment,
                amount=payment.amount * Decimal(random.uniform(0.1, 0.8)),  # Return a portion of the original amount
                payment_method=payment.payment_method,
                bank=random.choice(banks) if random.random() > 0.5 else None,
                bank_reference=f'RTN-{random.randint(1000, 9999)}' if random.random() > 0.5 else None,
                recorded_by=random.choice(users),
                payment_date=payment.payment_date + timezone.timedelta(
                    days=random.randint(5, 60),
                    hours=random.randint(0, 24),
                    minutes=random.randint(0, 60)
                ),
                notes=f"Return of payment {payment.id}: {fake.text(max_nb_chars=100)}" if random.random() > 0.5 else None,
                status='COMPLETED',
                reference_id=random.randint(1000, 9999) if random.random() > 0.5 else None
            )
            payment_returns.append(return_payment)
        
        return payment_returns