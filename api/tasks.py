# your_app/tasks.py
from celery import shared_task
from django.core.management import call_command

@shared_task
def process_expired_points():
    call_command('command_process_expired_points')