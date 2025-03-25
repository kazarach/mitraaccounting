import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import LogDrawer

class Command(BaseCommand):
    help = "Seed the database with LogDrawer records"

    def handle(self, *args, **kwargs):
        reasons = [
            "End of shift cash count",
            "Unexpected cash shortfall",
            "Manual adjustment by manager",
            "Daily reconciliation",
            "System error correction"
        ]

        logs = [
            LogDrawer(ld_date=timezone.now() - timezone.timedelta(days=random.randint(1, 30)),
                      ld_reason=random.choice(reasons))
            for _ in range(10)  # Create 10 random logs
        ]

        LogDrawer.objects.bulk_create(logs)
        self.stdout.write(self.style.SUCCESS(f"Successfully created {len(logs)} log drawer records"))
