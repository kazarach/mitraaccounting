from django.core.management.base import BaseCommand
from api.models.transaction_history import TransactionType

class Command(BaseCommand):
    help = "Seed TransactionType types only"

    def handle(self, *args, **options):
        type_data = [
            {"code": "SALE", "label": "Sale"},
            {"code": "PURCHASE", "label": "Purchase"},
            {"code": "USAGE", "label": "Usage"},
            {"code": "TRANSFER", "label": "Transfer"},
            {"code": "PAYMENT", "label": "Payment"},
            {"code": "RECEIPT", "label": "Receipt"},
            {"code": "ADJUSTMENT", "label": "Adjustment"},
            {"code": "EXPENSE", "label": "Expense"},
            {"code": "RETURN_PURCHASE", "label": "Return Purchase"},
            {"code": "RETURN_SALE", "label": "Return Sale"},
            {"code": "ORDERIN", "label": "Order In"},
            {"code": "ORDEROUT", "label": "Order Out"},
        ]

        created_count = 0
        for type in type_data:
            obj, created = TransactionType.objects.get_or_create(
                code=type["code"],
                defaults={"label": type["label"]}
            )
            if created:
                self.stdout.write(f"Created: {obj.code} - {obj.label}")
                created_count += 1
            else:
                self.stdout.write(f"Exists: {obj.code} - {obj.label}")

        self.stdout.write(self.style.SUCCESS(f"Finished seeding {created_count} new types."))
