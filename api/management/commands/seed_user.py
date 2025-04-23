import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from faker import Faker
from django.db import transaction
from api.models.custom_user import UserRole  # Ensure this import is correct

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed user accounts with random data and role levels'

    def handle(self, *args, **kwargs):
        fake = Faker()
        
        # Define the number of users to create
        num_users = 20
        
        # Define roles with their respective levels
        role_definitions = [
            {'name': 'superuser', 'level': 100},
            {'name': 'master', 'level': 80},
            {'name': 'admin', 'level': 60},
            {'name': 'staff', 'level': 40},
            {'name': 'cashier', 'level': 30},
            {'name': 'member', 'level': 10},
            {'name': 'user', 'level': 1}
        ]
        
        try:
            with transaction.atomic():
                # Create roles if they don't exist or update their levels
                roles = {}
                for role_def in role_definitions:
                    role, created = UserRole.objects.get_or_create(
                        name=role_def['name'],
                        defaults={'level': role_def['level']}
                    )
                    
                    # Update level if the role already existed but level is different
                    if not created and role.level != role_def['level']:
                        role.level = role_def['level']
                        role.save()
                    
                    roles[role_def['name']] = role
                
                # Clear existing users except superusers
                User.objects.exclude(is_superuser=True).delete()
                
                # Create superuser and admin user
                superuser_role = roles.get('superuser')
                admin_role = roles.get('admin')

                superuser = User.objects.create_superuser(
                    username='string', 
                    password='string', 
                    role=superuser_role
                )
                admin_user = User.objects.create_user(
                    username='admin_user', 
                    password='admin123', 
                    role=admin_role
                )
                
                self.stdout.write(self.style.SUCCESS(f'Successfully created superuser (level {superuser_role.level}) and admin user (level {admin_role.level})'))
                
                # Create other random users with weighted role selection
                # Higher weight for lower-level roles to create a realistic distribution
                weighted_roles = []
                for role_name, role in roles.items():
                    if role_name not in ['superuser', 'master', 'admin']:  # Exclude high-level roles
                        # Invert the weight so lower levels are more common
                        weight = 100 - role.level
                        weighted_roles.extend([role] * weight)
                
                users_created = []
                for _ in range(num_users):
                    username = fake.unique.user_name()
                    
                    # Choose a random role with weighting
                    random_role = random.choice(weighted_roles)
                    
                    user = User.objects.create_user(
                        username=username, 
                        password='password123',
                        role=random_role
                    )
                    users_created.append(f"{username} (role: {random_role.name}, level: {random_role.level})")
                
                # Print created users with their roles and levels
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {num_users} user accounts:'))
                for user_info in users_created:
                    self.stdout.write(f"  - {user_info}")
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding users: {str(e)}'))