from django.core.management.base import BaseCommand
from api.models import MemberType

class Command(BaseCommand):
    help = "Seed the database with MemberType records"

    def handle(self, *args, **kwargs):
        member_types = [
            {"mt_code": "BASIC", "mt_name": "Basic Member", "mt_omset": 10000.00},
            {"mt_code": "SILVER", "mt_name": "Silver Member", "mt_omset": 50000.00},
            {"mt_code": "GOLD", "mt_name": "Gold Member", "mt_omset": 100000.00},
            {"mt_code": "PLATINUM", "mt_name": "Platinum Member", "mt_omset": 500000.00},
        ]

        for mt in member_types:
            MemberType.objects.update_or_create(mt_code=mt["mt_code"], defaults=mt)

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {len(member_types)} member types"))
