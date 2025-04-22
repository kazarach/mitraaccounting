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
        num_users = 10
        
        # Ensure roles exist in the database
        role_names = ['superuser', 'master', 'admin', 'staff', 'member', 'user']
        
        try:
            with transaction.atomic():
                # Create roles if they don't exist
                roles = {}
                for name in role_names:
                    role, created = UserRole.objects.get_or_create(name=name)
                    roles[name] = role  # Store the role in a dictionary
                
                # Clear existing users except superusers
                User.objects.exclude(is_superuser=True).delete()
                
                # Create superuser and admin user
                superuser_role = roles.get('superuser')
                admin_role = roles.get('admin')

                superuser = User.objects.create_superuser(
                    username='string', 
                    password='string', 
                    role=superuser_role  # Assigning the superuser role
                )
                admin_user = User.objects.create_user(
                    username='admin_user', 
                    password='admin123', 
                    role=admin_role  # Assigning the admin role
                )
                
                self.stdout.write(self.style.SUCCESS('Successfully created superuser and admin user'))
                
                # Create other random users
                users_to_create = []
                for _ in range(num_users):
                    username = fake.unique.user_name()
                    
                    # Choose a random role
                    random_role = random.choice(list(roles.values()))
                    
                    # Create user with the role argument directly
                    user = User.objects.create_user(
                        username=username, 
                        password='password123',
                        role=random_role  # Pass the role during creation
                    )
                    users_to_create.append(user)
                
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {num_users} user accounts'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding users: {str(e)}'))
