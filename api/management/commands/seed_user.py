import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from faker import Faker
from django.db import transaction
from api.models.custom_user import UserRole  # Ensure this import is correct

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed user accounts with random data'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Define the number of users to create
        num_users = 50
        
        # Ensure roles exist in the database
        role_names = ['superuser', 'master', 'admin', 'staff', 'member', 'user']
        
        try:
            with transaction.atomic():
                # Create roles if they don't exist
                roles = []
                for name in role_names:
                    role, created = UserRole.objects.get_or_create(name=name)
                    roles.append(role)
                
                # Clear existing users except superusers
                User.objects.exclude(is_superuser=True).delete()
                
                # Create users
                users_to_create = []
                for _ in range(num_users):
                    username = fake.unique.user_name()
                    
                    # Alternate method of creating user
                    user = User.objects.create_user(
                        username=username, 
                        password='password123',  # Default password
                        role=random.choice(roles)  # Use the create_user method from UserAccountManager
                    )
                    users_to_create.append(user)
                
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {num_users} user accounts'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding users: {str(e)}'))